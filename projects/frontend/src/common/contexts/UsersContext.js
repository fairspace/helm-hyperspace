import React, {useContext} from 'react';
import KeycloakAPI from '../services/KeycloakAPI';
import UserContext from './UserContext';
import {isOrganisationAdmin, isWorkspaceCoordinator} from '../utils/userUtils';
import useAsync from '../hooks/UseAsync';

const UsersContext = React.createContext({});

export const UsersProvider = ({children, workspace}) => {
    const {currentUser: {authorizations: userAuthorizations}} = useContext(UserContext);

    const canFetchUsers = () => isOrganisationAdmin(userAuthorizations) || isWorkspaceCoordinator(userAuthorizations, workspace);

    const fetchUsers = () => (canFetchUsers() ? KeycloakAPI.getUsers : () => Promise.reject(new Error('Loggged-in user not allowed to fetch list of users')));

    const {data: users = [], loading, error, refresh} = useAsync(fetchUsers());

    return (
        <UsersContext.Provider
            value={{
                users,
                usersError: error,
                usersLoading: loading,
                refresh
            }}
        >
            {children}
        </UsersContext.Provider>
    );
};

export default UsersContext;

