package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.chart.ConfigOuterClass;
import hapi.release.StatusOuterClass;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import hapi.services.tiller.Tiller.InstallReleaseResponse;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.Executor;

import static java.lang.Integer.parseInt;
import static java.lang.System.currentTimeMillis;
import static java.util.Optional.ofNullable;
import static java.util.concurrent.Executors.newSingleThreadExecutor;

@Slf4j
public class WorkspaceService {
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());
    private static final long EXPIRATION_INTERVAL_MS = 300_000;
    private static final long INSTALLATION_TIMEOUT_SEC = 900;
    private static final long MAX_RELEASES_TO_RETURN = 100L;
    private static final String FILE_STORAGE_SIZE_YAML_PATH = "saturn.persistence.files.size";
    private static final String DATABASE_STORAGE_SIZE_YAML_PATH = "saturn.persistence.database.size";
    private static final String WORKSPACE_INGRESS_DOMAIN_YAML_PATH = "workspace.ingress.domain";
    private static final String HYPERSPACE_DOMAIN_YAML_PATH = "hyperspace.domain";
    private static final String HYPERSPACE_PREFIX = "hyperspace.";
    private static final String GIGABYTE_SUFFIX = "Gi";
    private static final EnumSet<StatusOuterClass.Status.Code> RELEVANT_STATUSES = EnumSet.of(
            StatusOuterClass.Status.Code.UNKNOWN,
            StatusOuterClass.Status.Code.DEPLOYED,
            StatusOuterClass.Status.Code.FAILED,
            StatusOuterClass.Status.Code.DELETING,
            StatusOuterClass.Status.Code.PENDING_INSTALL,
            StatusOuterClass.Status.Code.PENDING_UPGRADE,
            StatusOuterClass.Status.Code.PENDING_ROLLBACK);

    private final ReleaseManager releaseManager;
    private final ChartOuterClass.Chart.Builder chart;
    private final String domain;
    private final Map<String, Object> workspaceValues;
    private final Object lock = new Object();
    private List<Workspace> workspaces = new ArrayList<>();
    private long lastUpdateTime;
    private final Executor worker = newSingleThreadExecutor();

    public WorkspaceService(@NonNull ReleaseManager releaseManager, @NotNull ChartOuterClass.Chart.Builder chart, @NonNull String domain, @NonNull Map<String, Object> workspaceValues) {
        this.releaseManager = releaseManager;
        this.chart = chart;
        this.domain = domain;
        this.workspaceValues = workspaceValues;
    }

    public List<Workspace> listWorkspaces() {
        synchronized (lock) {
            if (currentTimeMillis() - lastUpdateTime > EXPIRATION_INTERVAL_MS) {
                workspaces = fetchWorkspaces();
                lastUpdateTime = currentTimeMillis();
            }
            return workspaces;
        }
    }

    private List<Workspace> fetchWorkspaces() {
        var result = new ArrayList<Workspace>();
        var request = ListReleasesRequest.newBuilder()
                .addAllStatusCodes(RELEVANT_STATUSES)
                .setLimit(MAX_RELEASES_TO_RETURN)
                .build();
        var responseIterator = releaseManager.list(request);
        while (responseIterator.hasNext()) {
            var response = responseIterator.next();
            response.getReleasesList().forEach(release -> {
                if (release.getChart().getMetadata().getName().equals(chart.getMetadata().getName())) {
                    result.add(Workspace.builder()
                            .name(release.getName())
                            .version(release.getChart().getMetadata().getVersion())
                            .status(release.getInfo().getStatus().getCode())
                            .logAndFilesVolumeSize(getSize(release.getConfig().getValuesMap().get(FILE_STORAGE_SIZE_YAML_PATH)))
                            .databaseVolumeSize(getSize(release.getConfig().getValuesMap().get(DATABASE_STORAGE_SIZE_YAML_PATH)))
                            .build());
                }
            });
        }
        return result;
    }

    public void installWorkspace(Workspace workspace) throws IOException {
        var config = ConfigOuterClass.Config.newBuilder()
                .setRaw(objectMapper.writeValueAsString(workspaceValues))
                .putValues(WORKSPACE_INGRESS_DOMAIN_YAML_PATH, ConfigOuterClass.Value.newBuilder().setValue(workspace.getName() + "." + domain).build())
                .putValues(HYPERSPACE_DOMAIN_YAML_PATH, ConfigOuterClass.Value.newBuilder().setValue(HYPERSPACE_PREFIX + domain).build())
                .putValues(FILE_STORAGE_SIZE_YAML_PATH, ConfigOuterClass.Value.newBuilder().setValue(workspace.getLogAndFilesVolumeSize() + GIGABYTE_SUFFIX).build())
                .putValues(DATABASE_STORAGE_SIZE_YAML_PATH, ConfigOuterClass.Value.newBuilder().setValue(workspace.getDatabaseVolumeSize() + GIGABYTE_SUFFIX).build())
                .build();
        var requestBuilder = InstallReleaseRequest.newBuilder()
                .setName(workspace.getName())
                .setNamespace(workspace.getName())
                .setValues(config)
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);
        var future = (ListenableFuture<InstallReleaseResponse>) releaseManager.install(requestBuilder, chart);
        future.addListener(() -> {
            synchronized (lock) {
                lastUpdateTime = 0;
            }
        }, worker);
    }

    private static int getSize(ConfigOuterClass.Value value) {
        return ofNullable(value)
                .map(ConfigOuterClass.Value::getValue)
                .map(str -> parseInt(str.substring(0, str.length() - GIGABYTE_SUFFIX.length())))
                .orElse(-1);
    }
}
