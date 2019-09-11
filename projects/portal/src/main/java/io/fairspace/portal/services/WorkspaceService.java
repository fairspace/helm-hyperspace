package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.chart.ConfigOuterClass;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static io.fairspace.portal.utils.JacksonUtils.merge;
import static java.lang.Integer.parseInt;
import static java.lang.System.currentTimeMillis;
import static java.lang.Thread.currentThread;
import static java.util.Optional.ofNullable;
import static java.util.concurrent.Executors.newSingleThreadExecutor;

@Slf4j
public class WorkspaceService {
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());
    private static final long EXPIRATION_INTERVAL_MS = 300_000;
    private static final long INSTALLATION_TIMEOUT_SEC = 900;
    private static final long MAX_RELEASES_TO_RETURN = 100L;
    private static final String WORKSPACE_NAME_YAML_PATH = "/workspace/name";
    private static final String WORKSPACE_DESCRIPTION_YAML_PATH = "/workspace/description";
    private static final String WORKSPACE_INGRESS_DOMAIN_YAML_PATH = "/workspace/ingress/domain";
    private static final String FILE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/files/size";
    private static final String DATABASE_STORAGE_SIZE_YAML_PATH = "/saturn/persistence/database/size";
    private static final String GIGABYTE_SUFFIX = "Gi";
    private static final EnumSet<Code> RELEVANT_STATUSES = EnumSet.of(
            Code.UNKNOWN,
            Code.DEPLOYED,
            Code.FAILED,
            Code.DELETING,
            Code.PENDING_INSTALL,
            Code.PENDING_UPGRADE,
            Code.PENDING_ROLLBACK);

    private final ReleaseManager releaseManager;
    private CachedReleaseList releaseList;
    private final ChartOuterClass.Chart.Builder chart;
    private final String domain;
    private final Map<String, ?> workspaceValues;
    private final Object lock = new Object();
    private List<Workspace> workspaces = new ArrayList<>();
    private long lastUpdateTime;
    private final Executor worker = newSingleThreadExecutor();

    public WorkspaceService(
            @NonNull ReleaseManager releaseManager,
            @NonNull CachedReleaseList releaseList,
            @NonNull ChartOuterClass.Chart.Builder chart,
            @NonNull String domain,
            @NonNull Map<String, ?> workspaceValues) {
        this.releaseManager = releaseManager;
        this.releaseList = releaseList;
        this.chart = chart;
        this.domain = domain;
        this.workspaceValues = workspaceValues;
    }

    public WorkspaceService(
            @NonNull ReleaseManager releaseManager,
            @NonNull CachedReleaseList releaseList,
            @NonNull String domain,
            @NonNull Map<String, ?> workspaceValues) throws IOException {
        this(releaseManager, releaseList, loadChart(CONFIG.charts.get(WORKSPACE_CHART)), domain, workspaceValues);
    }

    public List<Workspace> listWorkspaces() {
        return releaseList.get()
                .stream()
                .filter(release -> release.getChart().getMetadata().getName().equals(chart.getMetadata().getName()))
                .map(release -> {
                    try {
                        var config = objectMapper.readTree(release.getConfig().getRaw());
                        return Workspace.builder()
                                .id(release.getName())
                                .name(config.at(WORKSPACE_NAME_YAML_PATH).asText())
                                .description(config.at(WORKSPACE_DESCRIPTION_YAML_PATH).asText())
                                .url("https://" + config.at(WORKSPACE_INGRESS_DOMAIN_YAML_PATH).asText())
                                .version(release.getChart().getMetadata().getVersion())
                                .status(release.getInfo().getStatus().getCode() == Code.FAILED ? "Failed" : release.getInfo().getDescription())
                                .logAndFilesVolumeSize(getSize(config.at(FILE_STORAGE_SIZE_YAML_PATH).asText()))
                                .databaseVolumeSize(getSize(config.at(DATABASE_STORAGE_SIZE_YAML_PATH).asText()))
                                .build();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.toList());
    }

    public void installWorkspace(Workspace workspace) throws IOException {
        var customValues = objectMapper.createObjectNode();
        customValues.with("hyperspace").put("domain", domain);;
        customValues.with("hyperspace").with("elasticsearch").put("indexName", workspace.getId());
        customValues.with("workspace").put("name", workspace.getName());
        customValues.with("workspace").put("description", workspace.getDescription());
        customValues.with("workspace").with("ingress").put("domain", workspace.getId() + "." + domain);
        customValues.with("saturn").with("persistence").with("files").put("size", workspace.getLogAndFilesVolumeSize() + GIGABYTE_SUFFIX);
        customValues.with("saturn").with("persistence").with("database").put("size", workspace.getDatabaseVolumeSize() + GIGABYTE_SUFFIX);

        var values = merge(objectMapper.valueToTree(workspaceValues), customValues);
        var yaml = objectMapper.writeValueAsString(values);

        var requestBuilder = InstallReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setNamespace(workspace.getId())
                .setValues(ConfigOuterClass.Config.newBuilder().setRaw(yaml).build())
                .setTimeout(INSTALLATION_TIMEOUT_SEC)
                .setWait(true);
        var future = (ListenableFuture<?>) releaseManager.install(requestBuilder, chart);

        future.addListener(() -> {
            try {
                future.get();
                releaseList.invalidateCache();
            } catch (ExecutionException e) {
                log.error("Error installing workspace {}", workspace.getName(), e);
            } catch (InterruptedException e) {
                currentThread().interrupt();
            }
        }, worker);

        releaseList.invalidateCache();
    }

    private static int getSize(String value) {
        return ofNullable(value)
                .filter(str -> !str.isEmpty())
                .map(str -> parseInt(str.replace(GIGABYTE_SUFFIX, "")))
                .orElse(-1);
    }

    private static ChartOuterClass.Chart.Builder loadChart(URL chartUrl) throws IOException {
        try (var chartLoader = new URLChartLoader()) {
            return chartLoader.load(CONFIG.charts.get(WORKSPACE_CHART));
        } catch (Exception e) {
            log.error("Error downloading the workspace chart.", e);
            throw e;
        }
    }

}
