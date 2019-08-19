import React from 'react';
import {Route} from "react-router-dom";

import Home from "./home/Home";
import logout from "./common/services/logout";

const routes = () => (
    <>
        <Route path="/" exact component={Home} />
        <Route path="/login" render={() => {window.location.href = '/login';}} />
        <Route path="/logout" render={logout} />
    </>
);

export default routes;
