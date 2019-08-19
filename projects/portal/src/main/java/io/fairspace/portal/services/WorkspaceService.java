package io.fairspace.portal.services;

import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.Workspace;
import org.microbean.helm.ReleaseManager;

import java.io.Closeable;
import java.io.IOException;
import java.util.List;

import static java.util.stream.Collectors.toList;

public class WorkspaceService implements Closeable {
    private final ReleaseManager releaseManager;

    public WorkspaceService(ReleaseManager releaseManager) {
        this.releaseManager = releaseManager;
    }

    @Override
    public void close() throws IOException {
        releaseManager.close();
    }


    public List<Workspace> listWorkspaces() {
        var request = Tiller.ListReleasesRequest.newBuilder().build();
        var response = releaseManager.list(request);
        if (response.hasNext()) {
            return response.next()
                    .getReleasesList()
                    .stream()
                    .filter(release -> release.getChart().getMetadata().getName().equals("workspace"))
                    .map(release -> new Workspace(release.getName()))
                    .collect(toList());
        }
        return List.of();
    }
}
