import {useContext, useEffect} from 'react';
import HyperspaceContext from "./HyperspaceContext";

const separator = '-';

const UsePageTitleUpdater = (segments) => {
    const {name: hyperspaceName} = useContext(HyperspaceContext);

    useEffect(() => {
        const labels = segments ? segments.map(({label}) => label).join('/') : '';

        document.title = `${labels} ${separator} ${hyperspaceName}`;
    }, [hyperspaceName, segments]);
};

export default UsePageTitleUpdater;
