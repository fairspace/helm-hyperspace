import React from 'react';
import {BreadCrumbs, usePageTitleUpdater} from "@fairspace/shared-frontend";

export default () => {
    usePageTitleUpdater();
    return <BreadCrumbs />;
};
