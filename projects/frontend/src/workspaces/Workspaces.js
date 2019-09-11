import React, {useContext, useState} from 'react';
import {UserContext} from '@fairspace/shared-frontend';

import BreadCrumbs from "../common/components/BreadCrumbs";
import BreadcrumbsContext from "../common/contexts/BreadcrumbsContext";
import WorkspaceList from "./WorkspaceList";
import Button from "@material-ui/core/Button";
import NewWorkspaceDialog from "./NewWorkspaceDialog";
import WorkspaceAPI from "./WorkspaceAPI";
import AddingWorkspaceDialog from "./AddingWorkspaceDialog";
import {isOrganisationAdmin} from "../common/utils/userUtils";

export default () => {
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
    const [addingWorkspace, setAddingWorkspace] = useState(false);

    const createWorkspace = (workspace) => {
        setShowNewWorkspaceDialog(false);
        setAddingWorkspace(true);
        return WorkspaceAPI.createWorkspace(workspace);
    };

    const {currentUser: {authorizations}} = useContext(UserContext);

    return (
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
                <Button
                    style={{marginTop: 8}}
                    color="primary"
                    variant="contained"
                    aria-label="Add"
                    title="Create a new workspace"
                    disabled={showNewWorkspaceDialog || !isOrganisationAdmin(authorizations)}
                    onClick={() => setShowNewWorkspaceDialog(true)}
                >
                    New
            </Button>
                {showNewWorkspaceDialog && <NewWorkspaceDialog
                    onCreate={createWorkspace}
                    onClose={() => setShowNewWorkspaceDialog(false)}
                />}
                {addingWorkspace && <AddingWorkspaceDialog
                    onClose={() => setAddingWorkspace(false)}
                />}
            </BreadcrumbsContext.Provider>
        </>
    )
};
