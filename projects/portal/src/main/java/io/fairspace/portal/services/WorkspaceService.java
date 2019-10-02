package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.JsonNode;
import hapi.chart.ChartOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import io.fairspace.portal.services.releases.WorkspaceReleaseRequestBuilder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.utils.HelmUtils.*;
import static java.lang.String.format;
import static java.lang.Thread.currentThread;

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
    private final Executor worker;
    private final WorkspaceReleaseRequestBuilder workspaceReleaseRequestBuilder;
    private final Map<String, AppReleaseRequestBuilder> releaseRequestBuilders;

    public WorkspaceService(
            @NonNull ReleaseManager releaseManager,
            @NonNull CachedReleaseList releaseList,
            @NonNull ChartRepo repo,
            @NonNull Map<String, AppReleaseRequestBuilder> releaseRequestBuilders,
            @NonNull String domain,
            @NonNull Map<String, Map<String, ?>> defaultConfig,
            @NonNull Executor worker) {
        this.releaseManager = releaseManager;
        this.releaseList = releaseList;
        this.releaseRequestBuilders = releaseRequestBuilders;
        this.repo = repo;
        this.worker = worker;

        // Add a release builder for workspaces
        workspaceReleaseRequestBuilder = new WorkspaceReleaseRequestBuilder(domain, defaultConfig.get(WORKSPACE_CHART));

        if(!repo.contains(WORKSPACE_CHART)) {
            throw new IllegalStateException("No workspace chart is available in repo");
        }

        releaseRequestBuilders.keySet().forEach(key -> {
            if(!repo.contains(key)) {
                throw new IllegalStateException("No chart is available for the given app type: " + key);
            }
        });
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
                .filter(release -> releaseRequestBuilders.containsKey(release.getChart().getMetadata().getName()))
                .map(this::convertReleaseToWorkspaceApp)
                .collect(Collectors.toList());
    }

    /**
     * Install a workspace based on the given definition
     * @param workspace
     * @throws IOException
     */
    public void installWorkspace(Workspace workspace) throws IOException {
        installRelease(workspaceReleaseRequestBuilder.buildInstall(workspace), repo.get(WORKSPACE_CHART));
    }

    /**
     * Deletes a workspace installation
     * @throws IOException
     */
    public void uninstallWorkspace(@NonNull String workspaceId) throws IOException, NotFoundException {
        releaseList.invalidateCache();

        Workspace workspace = getWorkspace(workspaceId).orElseThrow(NotFoundException::new);

        // If there is any apps, remove them first
        for(WorkspaceApp app: workspace.getApps()) {
            uninstallApp(app.getId());
        }

        uninstallRelease(workspaceReleaseRequestBuilder.buildUninstall(workspace));
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

        // Ensure we are looking at a fresh copy of the workspaces list
        releaseList.invalidateCache();

        // Every app can only be installed once for a workspace. Check for duplicates
        List<WorkspaceApp> installedApps = listInstalledApps(workspaceId);
        if(installedApps.stream().anyMatch(installedApp -> installedApp.getType().equals(workspaceApp.getType()))) {
            throw new IllegalStateException("An app of type " + workspaceApp.getType() + " has already been installed for this workspace.");
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());
        ReleaseOuterClass.Release workspaceRelease = releaseList.getRelease(workspaceId).orElseThrow(() -> new NotFoundException("Workspace with given id could not be found"));
        ensureWorkspaceIsReady(workspaceRelease);

        // Set configuration and perform the actual installation
        InstallReleaseRequest.Builder installRequestBuilder = appReleaseRequestBuilder.appInstall(workspaceRelease, workspaceApp);
        installRelease(installRequestBuilder, repo.get(workspaceApp.getType()));

        // Update workspace release, if needed
        Optional<Tiller.UpdateReleaseRequest.Builder> builder = appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(workspaceRelease, workspaceApp);
        if(builder.isPresent()) {
            updateRelease(builder.get(), repo.get(WORKSPACE_CHART));
        }
    }

    /**
     * Deletes an app from a workspace
     *
     * @param appId
     * @throws NotFoundException
     * @throws IOException
     */
    public void uninstallApp(@NonNull String appId) throws NotFoundException, IOException {
        // Lookup releases
        ReleaseOuterClass.Release appRelease = releaseList.getRelease(appId).orElseThrow(() -> new NotFoundException("App with given id could not be found"));
        WorkspaceApp workspaceApp = convertReleaseToWorkspaceApp(appRelease);
        ReleaseOuterClass.Release workspaceRelease = releaseList.getRelease(workspaceApp.getWorkspaceId()).orElseThrow(() -> new NotFoundException("Workspace for the given app could not be found"));
        ensureWorkspaceIsReady(workspaceRelease);

        if(!releaseRequestBuilders.containsKey(workspaceApp.getType())) {
            throw new NotFoundException("App type " + workspaceApp.getType() + " not found");
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());

        // Set configuration and perform the actual installation
        Tiller.UninstallReleaseRequest.Builder uninstallRequestBuilder = appReleaseRequestBuilder.appUninstall(workspaceApp);
        uninstallRelease(uninstallRequestBuilder);

        // Update workspace release, if needed
        Optional<Tiller.UpdateReleaseRequest.Builder> builder = appReleaseRequestBuilder.workspaceUpdateAfterAppUninstall(workspaceRelease, workspaceApp);
        builder.ifPresent(update -> updateRelease(update, repo.get(WORKSPACE_CHART)));
    }

    private void ensureWorkspaceIsReady(ReleaseOuterClass.Release workspaceRelease) {
        if (workspaceRelease.getInfo().getStatus().getCode() != Code.DEPLOYED) {
            throw new IllegalStateException("Workspace " + workspaceRelease.getName() + " is not ready yet");
        }
    }

    /**
     * Installs the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @param chartBuilder
     * @throws IOException
     */
    private void installRelease(InstallReleaseRequest.Builder requestBuilder, ChartOuterClass.Chart.Builder chartBuilder) {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);
        log.info("Installing release {} with chart {} version {}", requestBuilder.getName(), chartBuilder.getMetadata().getName(), chartBuilder.getMetadata().getVersion());

        performWithCacheInvalidation("Helm install " + requestBuilder.getName(), () -> releaseManager.install(requestBuilder, chartBuilder));
    }

    /**
     * Upgrades the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @param chartBuilder
     * @throws IOException
     */
    private void updateRelease(Tiller.UpdateReleaseRequest.Builder requestBuilder, ChartOuterClass.Chart.Builder chartBuilder) {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);

        performWithCacheInvalidation(format("Helm upgrade release %s to version %s", requestBuilder.getName(), chartBuilder.getMetadata().getVersion()),
                () -> releaseManager.update(requestBuilder, chartBuilder));
    }

    /**
     * Uninstall the specified release and invalidates the cache when finished
     * @param requestBuilder
     * @throws IOException
     */
    private void uninstallRelease(Tiller.UninstallReleaseRequest.Builder requestBuilder) {
        requestBuilder
                .setTimeout(INSTALLATION_TIMEOUT_SEC);

        // Perform uninstallation command by helm
        performWithCacheInvalidation("Helm uninstall " + requestBuilder.getName(), () -> releaseManager.uninstall(requestBuilder.build()));
    }

    /**
     * Handles release list cache invalidation and error handling when a Helm command is executed and when it finishes
     * and ensures that no more than one command is executed at a time
     * @param commandDescription
     * @param action Action to performWithCacheInvalidation
     */
    private void performWithCacheInvalidation(String commandDescription, Callable<Future<?>> action) {
        worker.execute(() -> {
            try {
                log.info("Executing command {}", commandDescription);
                var future = action.call();
                releaseList.invalidateCache();
                future.get();
                log.info("Successfully executed command {}", commandDescription);
            } catch (InterruptedException e) {
                log.warn("Interrupted while performing command {}", commandDescription);
                currentThread().interrupt();
            } catch (Exception e) {
                log.error("Error performing command {}", commandDescription, e);
            } finally {
                releaseList.invalidateCache();
            }
        });
    }

    private Workspace convertReleaseToWorkspace(ReleaseOuterClass.Release release) {
        try {
            var config = getReleaseConfig(release);
            return Workspace.builder()
                    .id(release.getName())
                    .name(getConfigAsText(config, WORKSPACE_NAME_YAML_PATH))
                    .description(getConfigAsText(config, WORKSPACE_DESCRIPTION_YAML_PATH))
                    .url("https://" + getConfigAsText(config, WORKSPACE_INGRESS_DOMAIN_YAML_PATH))
                    .version(release.getChart().getMetadata().getVersion())
                    .status(release.getInfo().getStatus().getCode() == Code.FAILED ? "Failed" : release.getInfo().getDescription())
                    .errorMessage(release.getInfo().getStatus().getCode() == Code.FAILED ? release.getInfo().getDescription() : "")
                    .ready(release.getInfo().getStatus().getCode() == Code.DEPLOYED)
                    .logAndFilesVolumeSize(getSize(getConfigAsText(config, FILE_STORAGE_SIZE_YAML_PATH)))
                    .databaseVolumeSize(getSize(getConfigAsText(config, DATABASE_STORAGE_SIZE_YAML_PATH)))
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
                    .workspaceId(getConfigAsText(config, WORKSPACE_APP_WORKSPACE_ID_YAML_PATH))
                    .type(release.getChart().getMetadata().getName())
                    .version(release.getChart().getMetadata().getVersion())
                    .status(release.getInfo().getStatus().getCode() == Code.FAILED ? "Failed" : release.getInfo().getDescription())
                    .errorMessage(release.getInfo().getStatus().getCode() == Code.FAILED ? release.getInfo().getDescription() : "")
                    .ready(release.getInfo().getStatus().getCode() == Code.DEPLOYED)
                    .url("https://" + getConfigAsText(config, WORKSPACE_APP_INGRESS_DOMAIN_YAML_PATH))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String getConfigAsText(JsonNode config, String yamlPath) {
        if(config == null) {
            return null;
        }

        JsonNode node = config.at(yamlPath);

        if(node == null) {
            return null;
        }

        return node.asText();
    }

}
