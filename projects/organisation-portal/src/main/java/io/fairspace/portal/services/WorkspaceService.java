package io.fairspace.portal.services;

import io.fairspace.portal.model.Workspace;

import java.util.ArrayList;
import java.util.List;

public class WorkspaceService {
    private final List<Workspace> workspaces = new ArrayList<>();

    public List<Workspace> listWorkspaces() {
        synchronized (workspaces) {
            return new ArrayList<>(workspaces);
        }
    }

    public Workspace addWorkspace(Workspace workspace) {
        synchronized (workspaces) {
            workspaces.add(workspace);
        }
        return workspace;
    }
}
