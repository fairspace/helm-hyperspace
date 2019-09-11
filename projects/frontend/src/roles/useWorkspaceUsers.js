import {useCallback} from "react";
import useAsync from "../common/hooks/UseAsync";
import {ROLE_USER} from "../constants";
import {getRoleName, hasError, isLoading} from "./roleUtils";

const hasRole = (users, userId) => users.some(user => user.id === userId);
const refresh = (calls, role) => {
    if (role) {
        return calls[role].refresh();
    }

    return Promise.all(Object.values(calls).map(call => call.refresh()));
};

/**
 * This hook will load information for all users that have access to the given workspace
 *
 * It will return an array with all users that have access to the workspace. Each entry
 * is the keycloak object describing that user. In addition, it each user has an `authorizations` key
 * pointing to an object indicating the roles that a user has. If the value for a certain key is
 * truthy, the user has the given role for the current workspace. Please note that the keys are
 * the role names without workspace postfix ('user', 'coordinator', etc.)
 *
 * If any of the calls has an error, the returned error value will be true
 * If any of the calls is still loading, the returned loading value will be true
 * *
 * @param workspace Workspace name
 * @returns {{users: {}, error, loading}}
 */
export const useWorkspaceUsers = (workspace, roles, KeycloakAPI) => {
    const calls = {};

    const combineUserLists = userCalls => {
        if (hasError(userCalls) || isLoading(userCalls)) return [];

        // Return a list of all users with 'user' role, and add
        // a list of roles that the user has
        return userCalls.user.data.map(user => {
            // Create an object where each role is a key and the value is a boolean representing whether
            // the user has the specific role for this workspace
            const authorizations = roles.reduce((obj, role) => ({
                ...obj,
                [role]: role === ROLE_USER || hasRole(userCalls[role].data, user.id)
            }), {});

            return ({
                ...user,
                authorizations
            });
        });
    };

    roles.forEach(role => {
        const roleName = getRoleName(role, workspace);

        // We use a hook inside a loop, which is discouraged. However, as we use
        // a fixed array, the calls will always be made in the same order
        // eslint-disable-next-line react-hooks/rules-of-hooks
        calls[role] = useAsync(useCallback(() => KeycloakAPI.getUsersForRole(roleName), [roleName]));
    });

    return {
        error: hasError(calls),
        loading: isLoading(calls),
        users: combineUserLists(calls),
        refresh: (role) => refresh(calls, role)
    };
};
