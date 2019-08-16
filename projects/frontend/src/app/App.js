import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import {MuiThemeProvider} from '@material-ui/core/styles';

import Config from "../services/Config/Config";
import theme from './App.theme';
import Layout from "./Layout/Layout";
import LoadingInlay from './LoadingInlay';
import {UserProvider} from './UserContext';
import useIsMounted from "./useIsMounted";
import {HyperspaceProvider} from "./HyperspaceContext";

const App = () => {
    const isMounted = useIsMounted();
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        Config.init()
            .then(() => isMounted() && setConfigLoaded(true));
    }, [isMounted]);

    if (!configLoaded) {
        return <LoadingInlay />;
    }

    return (
        <HyperspaceProvider>
            <UserProvider>
                <MuiThemeProvider theme={theme}>
                    <Router>
                        <Layout />
                    </Router>
                </MuiThemeProvider>
            </UserProvider>
        </HyperspaceProvider>
    );
};

export default App;
