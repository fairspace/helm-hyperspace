import React from "react";
import {BreadcrumbsContext} from "@fairspace/shared-frontend";

export default ({workspaceId, appType, appId, children}) => (
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
            {
                label: appType,
                href: '/workspaces/' + workspaceId + '/apps/' + appId
            }
        ]
    }}
    >
        {children}
    </BreadcrumbsContext.Provider>
);
