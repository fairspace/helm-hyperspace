import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import {MuiThemeProvider} from '@material-ui/core/styles';
import useIsMounted from 'react-is-mounted-hook';
import {
    ErrorDialog, Layout, LoadingInlay, LogoutContextProvider, UserProvider, VersionProvider
} from '@fairspace/shared-frontend';

import theme from './App.theme';
import Config from "./common/services/Config";
import Menu from "./Menu";
import HyperspaceTopBar from './common/components/HyperspaceTopBar';
import MainLayout from "./MainLayout";

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
                <LogoutContextProvider
                    logoutUrl={Config.get().urls.logout}
                    jupyterhubUrl={Config.get().urls.jupyterhub}
                >
                    <MuiThemeProvider theme={theme}>
                        <ErrorDialog>
                            <Router>
                                <Layout
                                    renderMenu={() => <Menu />}
                                    renderMain={() => <MainLayout />}
                                    renderTopbar={({name}) => <HyperspaceTopBar name={name} />}
                                />
                            </Router>
                        </ErrorDialog>
                    </MuiThemeProvider>
                </LogoutContextProvider>
            </UserProvider>
        </VersionProvider>
    );
};

export default App;
