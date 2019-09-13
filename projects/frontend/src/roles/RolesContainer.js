import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {LoadingInlay, MessageDisplay, UserContext} from '@fairspace/shared-frontend';

import {isWorkspaceCoordinator, isOrganisationAdmin} from '../common/utils/userUtils';
import {useWorkspaceUsers} from "./useWorkspaceUsers";
import RolesList from "./RolesList";
import KeycloakAPI from "../common/services/KeycloakAPI";
import ErrorDialog from "../common/components/ErrorDialog";
import Config from "../common/services/Config/Config";
import {useRoles} from "./useRoles";

/**
 * This container will gaurd the access to the users fetching and user's access to the roles of the given workspace
 *
 * @param {*} workspaceId
 */
const RolesContainer = ({workspaceId}) => {
    const {roles: {workspaceRoles}} = Config.get();
    const {currentUser, currentUserLoading, currentUserError} = useContext(UserContext);
    const {error: roleError, loading: roleLoading, roles} = useRoles(workspaceId, workspaceRoles, KeycloakAPI);
    const {error: usersError, loading: usersLoading, users, refresh} = useWorkspaceUsers(workspaceId, workspaceRoles, KeycloakAPI);

    const isCurrentUserAdmin = isOrganisationAdmin(currentUser.authorizations);
    const isCurrentUserWorkspaceCoordinator = isWorkspaceCoordinator(currentUser.authorizations, workspaceId);

    const updateRole = (userId, role, hasRole) => KeycloakAPI
        .setRoleForUser(userId, roles[role].id, roles[role].name, hasRole)
        .then(() => refresh(role))
        .catch(e => ErrorDialog.showError(e, "An error occurred updating the role for this user"));

    // TODO: check that the workspace exists

    if (!isCurrentUserWorkspaceCoordinator && !isCurrentUserAdmin) {
        return <MessageDisplay message={`You do not have access to the roles in ${workspaceId}.`} />;
    }

    if (!workspaceId || workspaceId.trim().length === 0) {
        return <MessageDisplay message="No workspace is provided." />;
    }

    if (roleLoading || usersLoading || currentUserLoading) {
        return <LoadingInlay />;
    }

    if (roleError || usersError || currentUserError) {
        return <MessageDisplay message="Unable to retrieve the list of users or roles." />;
    }

    return (
        <RolesList
            workspaceId={workspaceId}
            users={users}
            currentUser={currentUser}
            roles={roles}
            canManageCoordinators={isCurrentUserAdmin}
            update={updateRole}
        />
    );
};

RolesContainer.propTypes = {
    workspaceId: PropTypes.string.isRequired
};

export default withRouter(RolesContainer);
