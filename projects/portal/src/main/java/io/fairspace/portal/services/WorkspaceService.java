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

public class WorkspaceService {
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

    public WorkspaceService(ReleaseManager releaseManager, URL chartUrl) throws IOException {
        this.releaseManager = releaseManager;

        try (var chartLoader = new URLChartLoader()) {
            chart = chartLoader.load(chartUrl);
        }
    }

    public List<Workspace> listWorkspaces() {
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
        return result;
    }

    public void installWorkspace(Workspace workspace) throws IOException {
        var requestBuilder = InstallReleaseRequest.newBuilder()
                .setName(workspace.getName())
                .setNamespace(workspace.getName());
        requestBuilder.getValuesBuilder().setRaw(workspace.getValues());
        releaseManager.install(requestBuilder, chart);
    }
}
