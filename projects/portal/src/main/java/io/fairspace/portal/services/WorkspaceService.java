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
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

import static java.lang.Integer.parseInt;
import static java.lang.String.format;
import static java.lang.System.currentTimeMillis;
import static java.util.concurrent.Executors.newSingleThreadExecutor;

@Slf4j
public class WorkspaceService {
    private static final String GIGABYTE_SUFFIX = "Gi";
    private static final long EXPIRATION_INTERVAL_MS = 300_000;
    private static final long INSTALLATION_TIMEOUT_SEC = 900;
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());

    private static final EnumSet<StatusOuterClass.Status.Code> RELEVANT_STATUSES = EnumSet.of(
            StatusOuterClass.Status.Code.UNKNOWN,
            StatusOuterClass.Status.Code.DEPLOYED,
            StatusOuterClass.Status.Code.FAILED,
            StatusOuterClass.Status.Code.DELETING,
            StatusOuterClass.Status.Code.PENDING_INSTALL,
            StatusOuterClass.Status.Code.PENDING_UPGRADE,
            StatusOuterClass.Status.Code.PENDING_ROLLBACK);

    private static final long MAX_RELEASES_TO_RETURN = 100L;
    public static final String SATURN_PERSISTENCE_FILES_SIZE = "saturn.persistence.files.size";
    public static final String SATURN_PERSISTENCE_DATABASE_SIZE = "saturn.persistence.database.size";

    private final ReleaseManager releaseManager;
    private final ChartOuterClass.Chart.Builder chart;
    private final String domainTemplate;
    private final Map<String, Object> workspaceValues;
    private final Object lock = new Object();
    private List<Workspace> workspaces = new ArrayList<>();
    private long lastUpdateTime;
    private final Executor worker = newSingleThreadExecutor();

    public WorkspaceService(ReleaseManager releaseManager, URL chartUrl, String domainTemplate, Map<String, Object> workspaceValues) throws IOException {
        this.releaseManager = releaseManager;
        this.domainTemplate = domainTemplate;
        this.workspaceValues = workspaceValues;

        try (var chartLoader = new URLChartLoader()) {
            chart = chartLoader.load(chartUrl);
        }
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
                if(release.getChart().getMetadata().getName().equals(chart.getMetadata().getName())) {
                    result.add(Workspace.builder()
                            .name(release.getName())
                            .version(release.getChart().getMetadata().getVersion())
                            .status(release.getInfo().getStatus().getCode())
                            .logAndFilesVolumeSize(getSize(release.getConfig().getValuesMap().get(SATURN_PERSISTENCE_FILES_SIZE).getValue()))
                            .databaseVolumeSize(getSize(release.getConfig().getValuesMap().get(SATURN_PERSISTENCE_DATABASE_SIZE).getValue()))
                            .build());
                }
            });
        }
        return result;
    }

    public void installWorkspace(Workspace workspace) throws IOException {
        var config = ConfigOuterClass.Config.newBuilder()
                .setRaw(objectMapper.writeValueAsString(workspaceValues))
                .putValues("workspace.ingress.domain", ConfigOuterClass.Value.newBuilder().setValue(format(domainTemplate, workspace.getName())).build())
                .putValues(SATURN_PERSISTENCE_FILES_SIZE, ConfigOuterClass.Value.newBuilder().setValue(workspace.getLogAndFilesVolumeSize() + GIGABYTE_SUFFIX).build())
                .putValues(SATURN_PERSISTENCE_DATABASE_SIZE, ConfigOuterClass.Value.newBuilder().setValue(workspace.getDatabaseVolumeSize() + GIGABYTE_SUFFIX).build())
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

    private static int getSize(String value) {
        return parseInt(value.substring(0, value.length() - GIGABYTE_SUFFIX.length()));
    }
}
