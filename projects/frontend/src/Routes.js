import React from 'react';
import {Route} from "react-router-dom";

import Home from "./home/Home";
import logout from "./common/services/logout";
import Workspaces from "./workspaces/Workspaces";
import RolesContainer from './roles/RolesContainer';

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/workspaces" exact component={Workspaces} />
        <Route
            path="/workspaces/:workspace/roles"
            exact
            render={({match: {params: {workspace}}}) => (
                <RolesContainer workspace={workspace} />
            )}
        />
        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route path="/logout" render={logout} />
    </>
);

export default routes;
