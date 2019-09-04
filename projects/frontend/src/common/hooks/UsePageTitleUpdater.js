import {useContext, useEffect} from 'react';
import VersionContext from "../contexts/VersionContext";

const separator = '-';

const UsePageTitleUpdater = (segments) => {
    const {name: hyperspaceName} = useContext(VersionContext);

    useEffect(() => {
        const labels = segments ? segments.map(({label}) => label).join('/') : '';

        document.title = `${labels} ${separator} ${hyperspaceName}`;
    }, [hyperspaceName, segments]);
};

export default UsePageTitleUpdater;
