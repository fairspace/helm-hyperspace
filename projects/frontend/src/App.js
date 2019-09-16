import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import {MuiThemeProvider} from '@material-ui/core/styles';
import useIsMounted from 'react-is-mounted-hook';
import {ErrorDialog, LoadingInlay, UserProvider, VersionProvider} from '@fairspace/shared-frontend';

import theme from './App.theme';
import Layout from "./common/components/Layout/Layout";
import Config from "./common/services/Config";

const App = () => {
    const isMounted = useIsMounted();
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        Config.init()
            .then(() => isMounted() && setConfigLoaded(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!configLoaded) {
        return <LoadingInlay />;
    }

    return (
        <VersionProvider url={Config.get().urls.version}>
            <UserProvider url={Config.get().urls.userInfo}>
                <MuiThemeProvider theme={theme}>
                    <ErrorDialog>
                        <Router>
                            <Layout />
                        </Router>
                    </ErrorDialog>
                </MuiThemeProvider>
            </UserProvider>
        </VersionProvider>
    );
};

export default App;
