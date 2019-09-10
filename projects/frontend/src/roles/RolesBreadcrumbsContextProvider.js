import React from "react";
import BreadcrumbsContext from "../common/contexts/BreadcrumbsContext";

export default ({workspace, children}) => (
    <BreadcrumbsContext.Provider value={{
        segments: [
            {
                label: 'Workspaces',
                icon: 'folder_open',
                href: '/workspaces'
            },
            {
                label: workspace,
                href: '/workspaces/' + workspace
            },
            {
                label: 'roles',
                href: '/workspaces/' + workspace + '/roles'
            },
        ]
    }}
    >
        {children}
    </BreadcrumbsContext.Provider>
);
