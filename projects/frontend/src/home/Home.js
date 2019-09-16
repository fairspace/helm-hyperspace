import React from 'react';
import {BreadCrumbs, usePageTitleUpdater} from "@fairspace/shared-frontend";

export default () => {
    usePageTitleUpdater("Home");
    return <BreadCrumbs />;
};
