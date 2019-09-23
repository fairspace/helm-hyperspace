package io.fairspace.portal.services.releases;

import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.WorkspaceApp;

import java.io.IOException;
import java.util.Optional;

/**
 * Describes the interface for providing all the information to add an app to a workspace
 */
public interface AppReleaseRequestBuilder {
    /**
     * Builds a release request to install a release
     *
     * @param workspaceRelease
     * @param params
     * @return The configured builder with all necessary configuration
     * @throws IOException
     */
    Tiller.InstallReleaseRequest.Builder appInstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp params) throws IOException;

    /**
     * Builds a release request to delete an app release
     *
     * @param params
     * @return The configured builder with all necessary configuration
     * @throws IOException
     */
    Tiller.UninstallReleaseRequest.Builder appUninstall(WorkspaceApp params) throws IOException;

    /**
     * Builds a request to update the workspace release after app installation
     * <p>
     * If the returned value is empty, no updates are needed
     *
     * @param workspaceRelease
     * @param workspaceApp
     * @return
     */
    default Optional<Tiller.UpdateReleaseRequest.Builder> workspaceUpdateAfterAppInstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp workspaceApp) throws IOException {
        return Optional.empty();
    }

    /**
     * Builds a request to update the workspace release after app deletion
     * <p>
     * If the returned value is empty, no updates are needed
     *
     * @param workspaceRelease
     * @param workspaceApp
     * @return
     */
    default Optional<Tiller.UpdateReleaseRequest.Builder> workspaceUpdateAfterAppUninstall(ReleaseOuterClass.Release workspaceRelease, WorkspaceApp workspaceApp) throws IOException {
        return Optional.empty();
    }

    ;

}
