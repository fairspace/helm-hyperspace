import React from "react";
import {BreadcrumbsContext} from "@fairspace/shared-frontend";

export default ({workspaceId, children}) => (
    <BreadcrumbsContext.Provider value={{
        segments: [
            {
                label: 'Workspaces',
                icon: 'folder_open',
                href: '/workspaces'
            },
            {
                label: workspaceId,
                href: '/workspaces/' + workspaceId
            },
            {
                label: 'apps',
                href: '/workspaces/' + workspaceId + '/apps'
            },
        ]
    }}
    >
        {children}
    </BreadcrumbsContext.Provider>
);
