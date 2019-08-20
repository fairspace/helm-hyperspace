import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import {MuiThemeProvider} from '@material-ui/core/styles';
import useIsMounted from 'react-is-mounted-hook';

import Config from "./common/services/Config/Config";
import theme from './App.theme';
import Layout from "./common/components/Layout/Layout";
import LoadingInlay from './common/components/LoadingInlay';
import {UserProvider} from './common/contexts/UserContext';
import {VersionProvider} from "./common/contexts/VersionContext";

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
        <VersionProvider>
            <UserProvider>
                <MuiThemeProvider theme={theme}>
                    <Router>
                        <Layout />
                    </Router>
                </MuiThemeProvider>
            </UserProvider>
        </VersionProvider>
    );
};

export default App;
