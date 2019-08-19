package io.fairspace.portal.services;

import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import org.microbean.helm.ReleaseManager;

import java.util.List;

import static java.util.stream.Collectors.toList;

public class WorkspaceService {
    private static final String WORKSPACE_CHART_NAME = "workspace";
    private static final String WORKSPACE_NAME_PREFIX = "workspace-";

    private final ReleaseManager releaseManager;

    public WorkspaceService(ReleaseManager releaseManager) {
        this.releaseManager = releaseManager;
    }

    public List<Workspace> listWorkspaces() {
        var response = releaseManager.list(ListReleasesRequest.getDefaultInstance());
        if (response.hasNext()) {
            return response.next()
                    .getReleasesList()
                    .stream()
                    .filter(release -> release.getChart().getMetadata().getName().equals(WORKSPACE_CHART_NAME))
                    .map(release -> new Workspace(stripNamePrefix(release.getName())))
                    .collect(toList());
        }
        return List.of();
    }

    private static String stripNamePrefix(String name) {
        return name.startsWith(WORKSPACE_NAME_PREFIX) ? name.substring(WORKSPACE_NAME_PREFIX.length()) : name;
    }
}
