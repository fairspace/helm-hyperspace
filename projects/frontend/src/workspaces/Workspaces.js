import React from 'react';
import BreadCrumbs from "../common/components/BreadCrumbs";
import BreadcrumbsContext from "../common/contexts/BreadcrumbsContext";
import WorkspaceList from "./WorkspaceList";

export default () => (
    <>
        <BreadcrumbsContext.Provider value={{
            segments: [{
                label: 'Workspaces',
                icon: 'folder_open',
                href: '/workspaces'
            }]
        }}
        >
            <BreadCrumbs />
            <WorkspaceList />
        </BreadcrumbsContext.Provider>
    </>
);
