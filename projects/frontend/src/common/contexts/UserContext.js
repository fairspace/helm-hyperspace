import React from 'react';

import onLogout from "../services/logout";
import AccountAPI from '../services/AccountAPI';
import useAsync from '../hooks/UseAsync';

const UserContext = React.createContext({});

export const UserProvider = ({children}) => {
    const {data: currentUser = {}, loading, error} = useAsync(AccountAPI.getUser);

    return (
        <UserContext.Provider
            value={{
                currentUser,
                currentUserLoading: loading,
                currentUserError: error,
                onLogout
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
