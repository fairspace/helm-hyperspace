import React from 'react';
import {Route} from "react-router-dom";
import {logout} from '@fairspace/shared-frontend';

import Config from "./common/services/Config/Config";
import Home from "./home/Home";
import Workspaces from "./workspaces/Workspaces";
import RolesContainer from './roles/RolesContainer';
import AppsContainer from "./apps/AppsContainer";

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/workspaces" exact component={Workspaces} />
        <Route
            path="/workspaces/:workspaceId/roles"
            exact
            render={({match: {params: {workspaceId}}}) => {
                return <RolesContainer workspaceId={workspaceId} />;
            }}
        />
        <Route
            path="/workspaces/:workspaceId/apps"
            exact
            render={({match: {params: {workspaceId}}}) => {
                return <AppsContainer workspaceId={workspaceId} />;
            }}
        />

        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route
            path="/logout"
            render={() => logout({
                logoutUrl: Config.get().urls.logout,
                jupyterhubUrl: Config.get().urls.jupyterhub
            })}
        />
    </>
);

export default routes;
