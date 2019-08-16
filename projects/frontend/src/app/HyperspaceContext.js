import React, {useState, useEffect} from 'react';

import HyperspaceAPI from "../services/HyperspaceAPI";

const initialState = {
    name: 'Fairspace',
    version: ''
};

const HyperspaceContext = React.createContext(initialState);

export const HyperspaceProvider = ({children}) => {
    const [info, setInfo] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        setLoading(true);
        HyperspaceAPI.getHyperspace()
            .then(i => {
                setInfo(i);
                setLoading(false);
            })
            .catch((error) => {
                setRedirecting(!!error.redirecting);
            });
    }, []);

    return (
        <HyperspaceContext.Provider
            value={{
                ...info,
                loading,
                redirecting,
            }}
        >
            {children}
        </HyperspaceContext.Provider>
    );
};

export default HyperspaceContext;
