import React, {useEffect, useState, useContext} from 'react';
import HyperspaceAPI from "../services/HyperspaceAPI";
import UserContext from './UserContext';
import {isOrganisationAdmin, isWorkspaceCoordinator} from '../utils/userUtils';

const UsersContext = React.createContext({});

export const UsersProvider = ({children, workspace}) => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const {currentUser: {authorizations: userAuthorizations}} = useContext(UserContext);

    const canFetchUsers = () => isOrganisationAdmin(userAuthorizations) || isWorkspaceCoordinator(userAuthorizations, workspace);

    const refresh = () => {
        if (canFetchUsers()) {
            setLoading(true);
            HyperspaceAPI.getUsers()
                .then(setUsers)
                .catch(setError)
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    // Refresh the permissions whenever the component is rerendered
    useEffect(refresh, []);

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
