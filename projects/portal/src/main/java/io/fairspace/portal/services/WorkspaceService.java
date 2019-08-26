package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import hapi.release.StatusOuterClass;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static java.util.concurrent.Executors.newSingleThreadScheduledExecutor;

public class WorkspaceService {
    private static final long REFRESH_INTERVAL = 1;
    private static final EnumSet<StatusOuterClass.Status.Code> RELEVANT_STATUSES = EnumSet.of(
            StatusOuterClass.Status.Code.UNKNOWN,
            StatusOuterClass.Status.Code.DEPLOYED,
            StatusOuterClass.Status.Code.FAILED,
            StatusOuterClass.Status.Code.DELETING,
            StatusOuterClass.Status.Code.PENDING_INSTALL,
            StatusOuterClass.Status.Code.PENDING_UPGRADE,
            StatusOuterClass.Status.Code.PENDING_ROLLBACK);

    private static final long MAX_RELEASES_TO_RETURN = 100L;

    private final ReleaseManager releaseManager;
    private final ChartOuterClass.Chart.Builder chart;
    private volatile List<Workspace> workspaces = List.of();
    private final ScheduledExecutorService worker = newSingleThreadScheduledExecutor();

    public WorkspaceService(ReleaseManager releaseManager, URL chartUrl) throws IOException {
        this.releaseManager = releaseManager;

        try (var chartLoader = new URLChartLoader()) {
            chart = chartLoader.load(chartUrl);
        }

        worker.scheduleWithFixedDelay(this::fetchWorkspaces, 0L, REFRESH_INTERVAL, TimeUnit.SECONDS);
    }

    public List<Workspace> listWorkspaces() {
        return workspaces;
    }

    private void fetchWorkspaces() {
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
                    result.add(new Workspace(release.getName(), release.getChart().getMetadata().getVersion(), release.getInfo().getStatus().getCode(), release.getConfig().getRaw()));
                }
            });
        }
        workspaces = result;
    }

    public void installWorkspace(Workspace workspace) throws IOException {
        var requestBuilder = InstallReleaseRequest.newBuilder()
                .setName(workspace.getName())
                .setNamespace(workspace.getName());
        requestBuilder.getValuesBuilder().setRaw(workspace.getValues());
        releaseManager.install(requestBuilder, chart);
    }
}
