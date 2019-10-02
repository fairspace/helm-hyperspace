package io.fairspace.portal.services;

import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.utils.HelmUtils.WORKSPACE_CHART;
import static io.fairspace.portal.utils.HelmUtils.getReleaseConfig;
import static io.fairspace.portal.utils.JacksonUtils.getConfigAsText;

@Slf4j
public class WorkspaceAppService {
    private static final String WORKSPACE_APP_WORKSPACE_ID_YAML_PATH = "/workspace/id";
    private static final String WORKSPACE_APP_INGRESS_DOMAIN_YAML_PATH = "/ingress/domain";

    private ReleaseService releaseService;
    private ChartRepo repo;
    private final Map<String, AppReleaseRequestBuilder> releaseRequestBuilders;

    public WorkspaceAppService(
            @NonNull ReleaseService releaseService,
            @NonNull ChartRepo repo,
            @NonNull Map<String, AppReleaseRequestBuilder> releaseRequestBuilders) {
        this.releaseService = releaseService;
        this.releaseRequestBuilders = releaseRequestBuilders;
        this.repo = repo;

        if(!repo.contains(WORKSPACE_CHART)) {
            throw new IllegalStateException("No workspace chart is available in repo");
        }

        releaseRequestBuilders.keySet().forEach(key -> {
            if(!repo.contains(key)) {
                throw new IllegalStateException("No chart is available for the given app type: " + key);
            }
        });
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
        return releaseService.getReleases()
                .stream()
                .filter(release -> releaseRequestBuilders.containsKey(release.getChart().getMetadata().getName()))
                .map(this::convertReleaseToWorkspaceApp)
                .collect(Collectors.toList());
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
        releaseService.invalidateCache();

        // Every app can only be installed once for a workspace. Check for duplicates
        List<WorkspaceApp> installedApps = listInstalledApps(workspaceId);
        if(installedApps.stream().anyMatch(installedApp -> installedApp.getType().equals(workspaceApp.getType()))) {
            throw new IllegalStateException("An app of type " + workspaceApp.getType() + " has already been installed for this workspace.");
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());
        ReleaseOuterClass.Release workspaceRelease = releaseService.getRelease(workspaceId).orElseThrow(() -> new NotFoundException("Workspace with given id could not be found"));
        ensureWorkspaceIsReady(workspaceRelease);

        // Set configuration and perform the actual installation
        InstallReleaseRequest.Builder installRequestBuilder = appReleaseRequestBuilder.appInstall(workspaceRelease, workspaceApp);
        releaseService.installRelease(installRequestBuilder, repo.get(workspaceApp.getType()));

        // Update workspace release, if needed
        Optional<Tiller.UpdateReleaseRequest.Builder> builder = appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(workspaceRelease, workspaceApp);
        builder.ifPresent(value -> releaseService.updateRelease(value, repo.get(WORKSPACE_CHART)));
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
        ReleaseOuterClass.Release appRelease = releaseService.getRelease(appId).orElseThrow(() -> new NotFoundException("App with given id could not be found"));
        WorkspaceApp workspaceApp = convertReleaseToWorkspaceApp(appRelease);
        ReleaseOuterClass.Release workspaceRelease = releaseService.getRelease(workspaceApp.getWorkspaceId()).orElseThrow(() -> new NotFoundException("Workspace for the given app could not be found"));
        ensureWorkspaceIsReady(workspaceRelease);

        if(!releaseRequestBuilders.containsKey(workspaceApp.getType())) {
            throw new NotFoundException("App type " + workspaceApp.getType() + " not found");
        }

        AppReleaseRequestBuilder appReleaseRequestBuilder = releaseRequestBuilders.get(workspaceApp.getType());

        // Set configuration and perform the actual installation
        Tiller.UninstallReleaseRequest.Builder uninstallRequestBuilder = appReleaseRequestBuilder.appUninstall(workspaceApp);
        releaseService.uninstallRelease(uninstallRequestBuilder);

        // Update workspace release, if needed
        Optional<Tiller.UpdateReleaseRequest.Builder> builder = appReleaseRequestBuilder.workspaceUpdateAfterAppUninstall(workspaceRelease, workspaceApp);
        builder.ifPresent(update -> releaseService.updateRelease(update, repo.get(WORKSPACE_CHART)));
    }
    
    private void ensureWorkspaceIsReady(ReleaseOuterClass.Release workspaceRelease) {
        if (workspaceRelease.getInfo().getStatus().getCode() != Code.DEPLOYED) {
            throw new IllegalStateException("Workspace " + workspaceRelease.getName() + " is not ready yet");
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

}
