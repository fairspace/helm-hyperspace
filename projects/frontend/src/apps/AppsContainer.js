import React, {useCallback, useContext} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {LoadingInlay, MessageDisplay, useAsync, UserContext} from "@fairspace/shared-frontend";
import {isOrganisationAdmin} from "../common/utils/userUtils";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import AppsList from "./AppsList";

/**
 * This container will gaurd the access to the users fetching and user's access to the roles of the given workspace
 *
 * @param {*} workspace
 */
const AppsContainer = ({workspaceId}) => {
    if (!workspaceId) throw Error("WorkspaceId should be provided to AppsContainer");

    const {currentUser, currentUserLoading, currentUserError} = useContext(UserContext);
    const {error, loading, data: apps, refresh} = useAsync(useCallback(() => WorkspaceAPI.getAppsForWorkspace(workspaceId), [workspaceId]));

    if (!isOrganisationAdmin(currentUser.authorizations)) {
        return <MessageDisplay message={`You do not have access to the apps in ${workspaceId}.`} />;
    }

    if (loading || currentUserLoading) {
        return <LoadingInlay />;
    }

    if (error || currentUserError) {
        return <MessageDisplay message="Unable to retrieve the information about apps in this workspace." />;
    }

    const addApp = appType => WorkspaceAPI.addAppToWorkspace(workspaceId, appType).then(refresh);
    const removeApp = appId => WorkspaceAPI.removeAppFromWorkspace(workspaceId, appId).then(refresh);

    return (
        <AppsList
            workspaceId={workspaceId}
            apps={apps}
            currentUser={currentUser}
            onAddApp={addApp}
            onRemoveApp={removeApp}
        />
    );
};

AppsContainer.propTypes = {
    workspaceId: PropTypes.string.isRequired
};

export default withRouter(AppsContainer);
