package io.fairspace.portal.services;

import hapi.release.ReleaseOuterClass;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.ReleaseInfo;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.WorkspaceReleaseRequestBuilder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.utils.HelmUtils.*;
import static io.fairspace.portal.utils.JacksonUtils.getConfigAsText;

@Slf4j
public class WorkspaceService {
    private static final String WORKSPACE_NAME_YAML_PATH = "/workspace/name";
    private static final String WORKSPACE_DESCRIPTION_YAML_PATH = "/workspace/description";
    private static final String WORKSPACE_INGRESS_DOMAIN_YAML_PATH = "/workspace/ingress/domain";
    private static final String FILE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/files/size";
    private static final String DATABASE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/database/size";

    private ReleaseService releaseService;
    private WorkspaceAppService workspaceAppService;
    private ChartRepo repo;
    private final WorkspaceReleaseRequestBuilder workspaceReleaseRequestBuilder;

    public WorkspaceService(
            @NonNull ReleaseService releaseService,
            @NonNull WorkspaceAppService workspaceAppService,
            @NonNull ChartRepo repo,
            @NonNull String domain,
            @NonNull Map<String, Map<String, ?>> defaultConfig) {
        this.releaseService = releaseService;
        this.workspaceAppService = workspaceAppService;
        this.repo = repo;

        // Add a release builder for workspaces
        workspaceReleaseRequestBuilder = new WorkspaceReleaseRequestBuilder(domain, defaultConfig.get(WORKSPACE_CHART));

        if(!repo.contains(WORKSPACE_CHART)) {
            throw new IllegalStateException("No workspace chart is available in repo");
        }
    }

    public List<Workspace> listWorkspaces() {
        var workspaceChart = repo.get(WORKSPACE_CHART);
        return releaseService.getReleases()
                .stream()
                .filter(release -> release.getChart().getMetadata().getName().equals(workspaceChart.getMetadata().getName()))
                .map(this::convertReleaseToWorkspace)
                .collect(Collectors.toList());
    }

    public Optional<Workspace> getWorkspace(String workspaceId) {
        return releaseService.getRelease(workspaceId)
                .filter(this::isWorkspace)
                .map(this::convertReleaseToWorkspace);
    }

    /**
     * Install a workspace based on the given definition
     * @param workspace
     * @throws IOException
     */
    public void installWorkspace(Workspace workspace) {
        releaseService.installRelease(workspaceReleaseRequestBuilder.buildInstall(workspace), repo.get(WORKSPACE_CHART));
    }

    /**
     * Updates a workspace installation with new parameters
     * @param workspace
     * @throws NotFoundException
     */
    public void updateWorkspace(Workspace workspace) throws NotFoundException {
        var release = releaseService.getRelease(workspace.getId())
                .filter(this::isWorkspace)
                .filter(r -> r.getInfo().getStatus().getCode() == Code.DEPLOYED)
                .orElseThrow(() -> new NotFoundException("Workspace " + workspace.getId() + " not found or not ready"));

        releaseService.updateRelease(workspaceReleaseRequestBuilder.buildUpdate(workspace), repo.get(WORKSPACE_CHART));
    }
    
    /**
     * Deletes a workspace installation
     * @throws IOException
     */
    public void uninstallWorkspace(@NonNull String workspaceId) throws IOException, NotFoundException {
        releaseService.invalidateCache();

        Workspace workspace = getWorkspace(workspaceId).orElseThrow(NotFoundException::new);

        // If there is any apps, remove them first
        for(WorkspaceApp app: workspace.getApps()) {
            workspaceAppService.uninstallApp(app.getId());
        }

        releaseService.uninstallRelease(workspaceReleaseRequestBuilder.buildUninstall(workspace));
    }

    private boolean isWorkspace(ReleaseOuterClass.Release release) {
        return release.getChart().getMetadata().getName().equals(repo.get(WORKSPACE_CHART).getMetadata().getName());
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
                    .release(releaseService.getReleaseInfo(release))
                    .logAndFilesVolumeSize(getSize(getConfigAsText(config, FILE_STORAGE_SIZE_YAML_PATH)))
                    .databaseVolumeSize(getSize(getConfigAsText(config, DATABASE_STORAGE_SIZE_YAML_PATH)))
                    .apps(workspaceAppService.listInstalledApps(release.getName()))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
