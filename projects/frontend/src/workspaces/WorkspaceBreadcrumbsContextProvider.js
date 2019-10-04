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
            }
        ]
    }}
    >
        {children}
    </BreadcrumbsContext.Provider>
);
