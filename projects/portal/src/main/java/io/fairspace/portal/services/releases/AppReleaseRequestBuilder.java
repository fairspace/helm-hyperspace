package io.fairspace.portal.services.releases;

import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.WorkspaceApp;

import java.io.IOException;

/**
 * Describes the interface for providing all the information to add an app to a workspace
 */
public interface AppReleaseRequestBuilder {
    /**
     * Builds a release request to install a release
     * @param workspaceRelease
     * @param params
     * @return The configured builder with all necessary configuration
     * @throws IOException
     */
    Tiller.InstallReleaseRequest.Builder appInstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp params) throws IOException;

    /**
     * Builds a release request to delete an app release
     * @param params
     * @return The configured builder with all necessary configuration
     * @throws IOException
     */
    Tiller.UninstallReleaseRequest.Builder appUninstall(WorkspaceApp params) throws IOException;

    /**
     * Determines whether the workspace should be updated after installing this release
     * @return
     */
    default boolean shouldUpdateWorkspace() {
        return false;
    }

    /**
     * Builds a request to update the workspace release after app installation
     *
     * Must not return null if {@link #shouldUpdateWorkspace()} returns true
     * @param workspaceRelease
     * @param workspaceApp
     * @return
     */
    default Tiller.UpdateReleaseRequest.Builder workspaceUpdateAfterAppInstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp workspaceApp) throws IOException {
        return null;
    }

    /**
     * Builds a request to update the workspace release after app deletion
     *
     * Must not return null if {@link #shouldUpdateWorkspace()} returns true
     * @param workspaceRelease
     * @param workspaceApp
     * @return
     */
    default Tiller.UpdateReleaseRequest.Builder workspaceUpdateAfterAppUninstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp workspaceApp) throws IOException {
        return null;
    };

}
