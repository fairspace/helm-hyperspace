package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import hapi.release.ReleaseOuterClass;
import io.fairspace.portal.errors.ConflictException;
import io.fairspace.portal.errors.NotFoundException;
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

import static io.fairspace.portal.utils.HelmUtils.*;
import static io.fairspace.portal.utils.JacksonUtils.getConfigAsText;

@Slf4j
public class WorkspaceService {
    private static final String WORKSPACE_NAME_YAML_PATH = "/workspace/name";
    private static final String WORKSPACE_DESCRIPTION_YAML_PATH = "/workspace/description";
    private static final String WORKSPACE_INGRESS_DOMAIN_YAML_PATH = "/workspace/ingress/domain";
    private static final String FILE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/files/size";
    private static final String DATABASE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/database/size";
    private static final int SATURN_RESTART_DELAY_MS = 20_000;

    private ReleaseService releaseService;
    private WorkspaceAppService workspaceAppService;
    private ChartOuterClass.Chart.Builder workspaceChart;
    private final WorkspaceReleaseRequestBuilder workspaceReleaseRequestBuilder;

    public WorkspaceService(
            @NonNull ReleaseService releaseService,
            @NonNull WorkspaceAppService workspaceAppService,
            @NonNull ChartOuterClass.Chart.Builder workspaceChart,
            @NonNull String domain,
            @NonNull Map<String, Map<String, ?>> defaultConfig) {
        this.releaseService = releaseService;
        this.workspaceAppService = workspaceAppService;
        this.workspaceChart = workspaceChart;

        // Add a release builder for workspaces
        workspaceReleaseRequestBuilder = new WorkspaceReleaseRequestBuilder(domain, defaultConfig.get(WORKSPACE_CHART));
    }

    public List<Workspace> listWorkspaces() {
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
        // Make sure that the workspace does not exist yet
        releaseService.invalidateCache();
        releaseService.getRelease(workspace.getId())
                .ifPresent(release -> {
                    throw new ConflictException("Workspace with identifier " + workspace.getId() + " already exists");
                });

        releaseService.installRelease(workspaceReleaseRequestBuilder.buildInstall(workspace), workspaceChart);
    }

    /**
     * Updates a workspace installation with new parameters
     * @param workspace
     * @throws NotFoundException
     */
    public void updateWorkspace(Workspace workspace) throws NotFoundException {
        var existingWorkspace = getWorkspace(workspace.getId())
                .filter(ws -> ws.getRelease().isReady())
                .orElseThrow(() -> new NotFoundException("Workspace " + workspace.getId() + " not found or not ready"));

        var saturnsPersistentVolumesResized = workspace.getDatabaseVolumeSize() != null && !workspace.getDatabaseVolumeSize().equals(existingWorkspace.getDatabaseVolumeSize())
                || workspace.getLogAndFilesVolumeSize() != null && !workspace.getLogAndFilesVolumeSize().equals(existingWorkspace.getLogAndFilesVolumeSize());

        if (saturnsPersistentVolumesResized) {
            var restartSaturnRequest = workspaceReleaseRequestBuilder.buildRestartPod(workspace.getId(), "saturn");
            releaseService.updateRelease(workspaceReleaseRequestBuilder.buildUpdate(workspace), workspaceChart,
                    () -> releaseService.updateRelease(restartSaturnRequest, workspaceChart), SATURN_RESTART_DELAY_MS);
        } else {
            releaseService.updateRelease(workspaceReleaseRequestBuilder.buildUpdate(workspace), workspaceChart);
        }
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
        return release.getChart().getMetadata().getName().equals(workspaceChart.getMetadata().getName());
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
                    .release(ReleaseService.getReleaseInfo(release))
                    .logAndFilesVolumeSize(getSize(getConfigAsText(config, FILE_STORAGE_SIZE_YAML_PATH)))
                    .databaseVolumeSize(getSize(getConfigAsText(config, DATABASE_STORAGE_SIZE_YAML_PATH)))
                    .apps(workspaceAppService.listInstalledApps(release.getName()))
                    .build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
