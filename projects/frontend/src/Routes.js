import React from 'react';
import {Route} from "react-router-dom";

import Home from "./home/Home";
import logout from "./common/services/logout";
import Workspaces from "./workspaces/Workspaces";
import ManageRoles from './roles/ManageRoles';
import Roles from './roles/Roles';

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/workspaces" component={Workspaces} />
        {/* <Route path="/roles" exact component={ManageRoles} /> */}
        <Route path="/roles" exact component={Roles} />
        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route path="/logout" render={logout} />
    </>
);

export default routes;
