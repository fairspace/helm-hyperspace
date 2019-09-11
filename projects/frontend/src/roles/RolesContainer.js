import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import UserContext from '../common/contexts/UserContext';
import {useWorkspaceUsers} from "./useWorkspaceUsers";
import RolesList from "./RolesList";
import {isOrganisationAdmin, isWorkspaceCoordinator} from "../common/utils/userUtils";
import KeycloakAPI from "../common/services/KeycloakAPI";
import MessageDisplay from "../common/components/MessageDisplay";
import LoadingInlay from "../common/components/LoadingInlay";
import ErrorDialog from "../common/components/ErrorDialog";
import Config from "../common/services/Config/Config";
import {useRoles} from "./useRoles";

/**
 * This container will gaurd the access to the users fetching and user's access to the roles of the given workspace
 *
 * @param {*} workspace
 */
const RolesContainer = ({workspace}) => {
    const {roles: {workspaceRoles}} = Config.get();
    const {currentUser, currentUserLoading, currentUserError} = useContext(UserContext);
    const {error: roleError, loading: roleLoading, roles} = useRoles(workspace, workspaceRoles, KeycloakAPI);
    const {error: usersError, loading: usersLoading, users, refresh} = useWorkspaceUsers(workspace, workspaceRoles, KeycloakAPI);

    const isCurrentUserAdmin = isOrganisationAdmin(currentUser.authorizations);
    const isCurrentUserWorkspaceCoordinator = isWorkspaceCoordinator(currentUser.authorizations, workspace);

    const updateRole = (userId, role, hasRole) => KeycloakAPI
        .setRoleForUser(userId, roles[role].id, roles[role].name, hasRole)
        .then(() => refresh(role))
        .catch(e => ErrorDialog.showError(e, "An error occurred updating the role for this user"));

    // TODO: check that the workspace exists

    if (!isCurrentUserWorkspaceCoordinator && !isCurrentUserAdmin) {
        return <MessageDisplay message={`You do not have access to the roles in ${workspace}.`} />;
    }

    if (!workspace || workspace.trim().length === 0) {
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
            workspace={workspace}
            users={users}
            currentUser={currentUser}
            roles={roles}
            canManageCoordinators={isCurrentUserAdmin}
            update={updateRole}
        />
    );
};

RolesContainer.propTypes = {
    workspace: PropTypes.string.isRequired
};

export default withRouter(RolesContainer);
