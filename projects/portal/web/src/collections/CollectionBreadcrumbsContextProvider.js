import React from "react";
import {BreadcrumbsContext} from "../common";

export default ({children}) => (
    <BreadcrumbsContext.Provider value={{segments: [
        {
            label: 'Collections',
            icon: 'folder_open',
            href: '/collections'
        }
    ]}}
    >
        {children}
    </BreadcrumbsContext.Provider>
);
