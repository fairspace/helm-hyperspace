package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class WorkspaceService {
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
        var responseIterator = releaseManager.list(ListReleasesRequest.getDefaultInstance());
        while (responseIterator.hasNext()) {
            var response = responseIterator.next();
            response.getReleasesList().forEach(release -> {
                if(release.getChart().getMetadata().getName().equals(chart.getMetadata().getName())) {
                    result.add(new Workspace(stripNamePrefix(release.getName()), release.getChart().getMetadata().getVersion()));
                }
            });
        }
        return result;
    }

    private String stripNamePrefix(String name) {
        return  name.startsWith(chart.getMetadata().getName() + "-")
                ? name.substring(chart.getMetadata().getName().length() + 1)
                : name;
    }
}
