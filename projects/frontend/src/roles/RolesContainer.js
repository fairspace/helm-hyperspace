import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";

import UsersContext from '../common/contexts/UsersContext';
import {isWorkspaceCoordinator, isOrganisationAdmin, userHasAnyRoleInWorkspace} from '../common/utils/userUtils';
import LoadingInlay from '../common/components/LoadingInlay';
import MessageDisplay from '../common/components/MessageDisplay';
import UserContext from '../common/contexts/UserContext';
import Roles from './Roles';

/**
 * This container will gaurd the access to the users fetching and user's access to the roles of the given workspace
 *
 * @param {*} workspace
 */
const RolesContainer = ({workspace}) => {
    const {currentUser: {authorizations: userAuthorizations}, currentUserLoading, currentUserError} = useContext(UserContext);
    const {users, usersError, usersLoading} = useContext(UsersContext);

    const isCurrentUserAdmin = isOrganisationAdmin(userAuthorizations);
    const allWorkspaceUsers = users.filter(({authorizations}) => userHasAnyRoleInWorkspace(authorizations, workspace));
    const usersToHandle = isCurrentUserAdmin ? allWorkspaceUsers : allWorkspaceUsers.filter(({authorizations}) => !isWorkspaceCoordinator(authorizations, workspace));

    // TODO: check that the workspace exists

    if (!isWorkspaceCoordinator(userAuthorizations, workspace) && !isCurrentUserAdmin) {
        return <MessageDisplay message={`You do not have access to the roles in ${workspace}.`} />;
    }

    if (!workspace || workspace.trim().length === 0) {
        return <MessageDisplay message="No workspace is provided." />;
    }

    if (usersLoading || currentUserLoading) {
        return <LoadingInlay />;
    }

    if (usersError || currentUserError) {
        return <MessageDisplay message="Unable to retrieve the list of users." />;
    }

    if (usersToHandle && usersToHandle.length === 0) {
        return <MessageDisplay message={`No users for ${workspace}`} />;
    }

    return (
        <Roles
            workspace={workspace}
            users={usersToHandle}
            canManageCoordinators={isCurrentUserAdmin}
        />
    );
};

RolesContainer.propTypes = {
    workspace: PropTypes.string.isRequired
};

export default withRouter(RolesContainer);
