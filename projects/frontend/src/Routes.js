import React from 'react';
import {Route} from "react-router-dom";
import {logout} from '@fairspace/shared-frontend';

import Config from "./common/services/Config";
import Home from "./home/Home";
import WorkspacesPage from "./workspaces/WorkspacesPage";
import RolesContainer from './roles/RolesContainer';
import AppsContainer from "./apps/AppsContainer";
import SearchPage from './search/SearchPage';
import WorkspacePage from "./workspaces/WorkspacePage";
import AppPage from "./apps/AppPage";

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/workspaces" exact component={WorkspacesPage} />
        <Route
            path="/workspaces/:workspaceId"
            exact
            render={({match: {params: {workspaceId}}}) => <WorkspacePage workspaceId={workspaceId} />}
        />
        <Route
            path="/workspaces/:workspaceId/roles"
            exact
            render={({match: {params: {workspaceId}}}) => <RolesContainer workspaceId={workspaceId} />}
        />
        <Route
            path="/workspaces/:workspaceId/apps"
            exact
            render={({match: {params: {workspaceId}}}) => <AppsContainer workspaceId={workspaceId} />}
        />
        <Route
            path="/workspaces/:workspaceId/apps/:appId"
            exact
            render={({match: {params: {workspaceId, appId}}}) => <AppPage workspaceId={workspaceId} appId={appId} />}
        />

        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route
            path="/logout"
            render={() => logout({
                logoutUrl: Config.get().urls.logout,
                jupyterhubUrl: Config.get().urls.jupyterhub
            })}
        />
        <Route
            path="/search"
            render={({location, history}) => <SearchPage location={location} history={history} />}
        />
    </>
);

export default routes;
