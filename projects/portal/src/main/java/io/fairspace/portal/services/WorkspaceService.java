package io.fairspace.portal.services;

import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import io.fairspace.portal.services.releases.JupyterReleaseRequestBuilder;
import io.fairspace.portal.services.releases.WorkspaceReleaseRequestBuilder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.utils.HelmUtils.*;
import static java.lang.Thread.currentThread;
import static java.util.concurrent.Executors.newSingleThreadExecutor;

@Slf4j
public class WorkspaceService {
    private static final long INSTALLATION_TIMEOUT_SEC = 900;
    private static final String WORKSPACE_NAME_YAML_PATH = "/workspace/name";
    private static final String WORKSPACE_DESCRIPTION_YAML_PATH = "/workspace/description";
    private static final String WORKSPACE_INGRESS_DOMAIN_YAML_PATH = "/workspace/ingress/domain";
    private static final String FILE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/files/size";
    private static final String DATABASE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/database/size";
    private static final String WORKSPACE_APP_WORKSPACE_ID_YAML_PATH = "/workspace/id";
    private static final String WORKSPACE_APP_INGRESS_DOMAIN_YAML_PATH = "/ingress/domain";


    private final ReleaseManager releaseManager;
    private CachedReleaseList releaseList;
    private ChartRepo repo;
    private List<String> supportedApps;
    private final Executor worker = newSingleThreadExecutor();
    private final WorkspaceReleaseRequestBuilder workspaceReleaseRequestBuilder;
    private final Map<String, AppReleaseRequestBuilder> releaseRequestBuilders = new HashMap<>();

    public WorkspaceService(
            @NonNull ReleaseManager releaseManager,
            @NonNull CachedReleaseList releaseList,
            @NonNull ChartRepo repo,
            @NonNull String domain,
            @NonNull Map<String, Map<String, ?>> defaultConfig
            ) {
        this.releaseManager = releaseManager;
        this.releaseList = releaseList;
        this.repo = repo;

        // Setup release request builders
        workspaceReleaseRequestBuilder = new WorkspaceReleaseRequestBuilder(domain, defaultConfig.get(WORKSPACE_CHART));
        releaseRequestBuilders.put(JUPYTER_CHART, new JupyterReleaseRequestBuilder(defaultConfig.get(JUPYTER_CHART)));

        // Store list of supported Apps
        this.supportedApps = releaseRequestBuilders.keySet().stream().filter(key -> !key.equals(WORKSPACE_CHART)).collect(Collectors.toList());

        if(!repo.contains(WORKSPACE_CHART)) {
            throw new IllegalStateException("No workspace chart is available in repo");
        }
    }

    public List<Workspace> listWorkspaces() {
        var workspaceChart = repo.get(WORKSPACE_CHART);
        return releaseList.get()
                .stream()
                .filter(release -> release.getChart().getMetadata().getName().equals(workspaceChart.getMetadata().getName()))
                .map(this::convertReleaseToWorkspace)
                .collect(Collectors.toList());
    }

    public Optional<Workspace> getWorkspace(String workspaceId) {
        var workspaceChart = repo.get(WORKSPACE_CHART);
        return releaseList.getRelease(workspaceId)
                .filter(release -> release.getChart().getMetadata().getName().equals(workspaceChart.getMetadata().getName()))
                .map(this::convertReleaseToWorkspace);
    }

    /**
     * Returns a list of installed apps for the given workspaceId
     * @return
     */
    public List<WorkspaceApp> listInstalledApps(@NonNull String workspaceId) {
        return listInstalledApps()
                .stream()
                .filter(app -> workspaceId.equals(app.getWorkspaceId()))
                .collect(Collectors.toList());
    }

    /**
     * Returns a list of all installed apps throughout the cluster
     * @return
     */
    public List<WorkspaceApp> listInstalledApps() {
        return releaseList.get()
                .stream()
                .filter(release -> supportedApps.contains(release.getChart().getMetadata().getName()))
                .map(this::convertReleaseToWorkspaceApp)
                .collect(Collectors.toList());
    }

    /**
     * Install a workspace based on the given definition
     * @param workspace
     * @throws IOException
     */
    public void installWorkspace(Workspace workspace) throws IOException {
        installRelease(workspaceReleaseRequestBuilder.build(workspace), repo.get(WORKSPACE_CHART));
    }

    /**
     * Install a certain app into the given workspace
     *
     * The type of app installed is determined by the {workspaceApp.type} parameter
     * @param workspaceId
     * @param workspaceApp
     * @throws NotFoundException
     * @throws IOException
     */
    public void installApp(@NonNull String workspaceId, @NonNull WorkspaceApp workspaceApp) throws NotFoundException, IOException {
        if(!releaseRequestBuilders.containsKey(workspaceApp.getType())) {
            throw new NotFoundException("App type " + workspaceApp.getType() + " not found");
        }

        if(!repo.contains(workspaceApp.getType())) {
            throw new NotFoundException("No chart found for app type " + workspaceApp.getType());
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());
        ReleaseOuterClass.Release workspaceRelease = releaseList.getRelease(workspaceId).orElseThrow(() -> new NotFoundException("Workspace with given id could not be found"));

        // Set configuration and perform the actual installation
        InstallReleaseRequest.Builder installRequestBuilder = appReleaseRequestBuilder.appInstall(workspaceRelease, workspaceApp);
        installRelease(installRequestBuilder, repo.get(workspaceApp.getType()));

        // Update workspace release
        if(appReleaseRequestBuilder.shouldUpdateWorkspace()) {
            Tiller.UpdateReleaseRequest.Builder updateRequestBuilder = appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(workspaceRelease, workspaceApp);
            updateRelease(updateRequestBuilder, repo.get(WORKSPACE_CHART));
        }
    }

    /**
     * Deletes an app from a workspace
     *
     * @param appId
     * @throws NotFoundException
     * @throws IOException
     */
    public void deleteApp(@NonNull String appId) throws NotFoundException, IOException {
        // Lookup releases
        ReleaseOuterClass.Release appRelease = releaseList.getRelease(appId).orElseThrow(() -> new NotFoundException("App with given id could not be found"));
        WorkspaceApp workspaceApp = convertReleaseToWorkspaceApp(appRelease);
        ReleaseOuterClass.Release workspaceRelease = releaseList.getRelease(workspaceApp.getWorkspaceId()).orElseThrow(() -> new NotFoundException("Workspace for the given app could not be found"));

        if(!releaseRequestBuilders.containsKey(workspaceApp.getType())) {
            throw new NotFoundException("App type " + workspaceApp.getType() + " not found");
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());

        // Set configuration and perform the actual installation
        Tiller.UninstallReleaseRequest.Builder uninstallRequestBuilder = appReleaseRequestBuilder.appUninstall(workspaceApp);
        uninstallRelease(uninstallRequestBuilder);

        // Update workspace release
        if(appReleaseRequestBuilder.shouldUpdateWorkspace()) {
            Tiller.UpdateReleaseRequest.Builder updateRequestBuilder = appReleaseRequestBuilder.workspaceUpdateAfterAppUninstall(workspaceRelease, workspaceApp);
            updateRelease(updateRequestBuilder, repo.get(WORKSPACE_CHART));
        }
    }

    /**
     * Installs the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @param chartBuilder
     * @throws IOException
     */
    private void installRelease(InstallReleaseRequest.Builder requestBuilder, ChartOuterClass.Chart.Builder chartBuilder) throws IOException {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);
        log.info("Installing release {} with chart {} version {}", requestBuilder.getName(), chartBuilder.getMetadata().getName(), chartBuilder.getMetadata().getVersion());
        var future = (ListenableFuture<?>) releaseManager.install(requestBuilder, chartBuilder);

        handleCacheInvalidation(future, "Install " + requestBuilder.getName());
    }

    /**
     * Upgrades the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @param chartBuilder
     * @throws IOException
     */
    private void updateRelease(Tiller.UpdateReleaseRequest.Builder requestBuilder, ChartOuterClass.Chart.Builder chartBuilder) throws IOException {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);
        log.info("Updating release {} with chart {} version {}", requestBuilder.getName(), chartBuilder.getMetadata().getName(), chartBuilder.getMetadata().getVersion());
        var future = (ListenableFuture<?>) releaseManager.update(requestBuilder, chartBuilder);

        handleCacheInvalidation(future, "Update " + requestBuilder.getName());
    }

    /**
     * Uninstall the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @throws IOException
     */
    private void uninstallRelease(Tiller.UninstallReleaseRequest.Builder requestBuilder) throws IOException {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC);
        log.info("Uninstalling release {}", requestBuilder.getName());
        var future = (ListenableFuture<?>) releaseManager.uninstall(requestBuilder.build());

        handleCacheInvalidation(future, "Uninstall " + requestBuilder.getName());
    }

    /**
     * Handles release list cache invalidation when a helm command is executed and when it finishes
     * @param future
     * @param helmCommand
     */
    private void handleCacheInvalidation(ListenableFuture<?> future, String helmCommand) {
        future.addListener(() -> {
            try {
                future.get();
                releaseList.invalidateCache();
            } catch (ExecutionException e) {
                log.error("Error performing helm command {}", helmCommand, e);
            } catch (InterruptedException e) {
                currentThread().interrupt();
            }
        }, worker);

        releaseList.invalidateCache();
    }

    private Workspace convertReleaseToWorkspace(ReleaseOuterClass.Release release) {
        try {
            var config = getReleaseConfig(release);
            return Workspace.builder()
                    .id(release.getName())
                    .name(config.at(WORKSPACE_NAME_YAML_PATH).asText())
                    .description(config.at(WORKSPACE_DESCRIPTION_YAML_PATH).asText())
                    .url("https://" + config.at(WORKSPACE_INGRESS_DOMAIN_YAML_PATH).asText())
                    .version(release.getChart().getMetadata().getVersion())
                    .status(release.getInfo().getStatus().getCode() == Code.FAILED ? "Failed" : release.getInfo().getDescription())
                    .logAndFilesVolumeSize(getSize(config.at(FILE_STORAGE_SIZE_YAML_PATH).asText()))
                    .databaseVolumeSize(getSize(config.at(DATABASE_STORAGE_SIZE_YAML_PATH).asText()))
                    .apps(listInstalledApps(release.getName()))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private WorkspaceApp convertReleaseToWorkspaceApp(ReleaseOuterClass.Release release) {
        try {
            var config = getReleaseConfig(release);

            return WorkspaceApp.builder()
                    .id(release.getName())
                    .workspaceId(config.at(WORKSPACE_APP_WORKSPACE_ID_YAML_PATH).asText())
                    .type(release.getChart().getMetadata().getName())
                    .version(release.getChart().getMetadata().getVersion())
                    .status(release.getInfo().getStatus().getCode() == Code.FAILED ? "Failed" : release.getInfo().getDescription())
                    .url("https://" + config.at(WORKSPACE_APP_INGRESS_DOMAIN_YAML_PATH).asText())
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
