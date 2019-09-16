import React, {useContext, useState} from 'react';
import {Button, Snackbar, IconButton} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import {UserContext, BreadcrumbsContext, BreadCrumbs, usePageTitleUpdater} from '@fairspace/shared-frontend';

import WorkspaceList from "./WorkspaceList";
import NewWorkspaceDialog from "./NewWorkspaceDialog";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import {isOrganisationAdmin} from "../common/utils/userUtils";

export default () => {
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
    const [addingWorkspace, setAddingWorkspace] = useState(false);

    usePageTitleUpdater("Workspaces");

    const createWorkspace = (workspace) => {
        setShowNewWorkspaceDialog(false);
        setAddingWorkspace(true);
        return WorkspaceAPI.createWorkspace(workspace);
    };

    const {currentUser: {authorizations}} = useContext(UserContext);

    return (
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

                Add New Workspace
                </Button>
            {showNewWorkspaceDialog && (
                <NewWorkspaceDialog
                    onCreate={createWorkspace}
                    onClose={() => setShowNewWorkspaceDialog(false)}
                />
            )}
            {addingWorkspace && (
                <Snackbar
                    open
                    onClose={() => setAddingWorkspace(false)}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    message={<span>The workspace is being created, this might take a while</span>}
                    autoHideDuration={6000}
                    action={(
                        <IconButton
                            aria-label="Close"
                            color="inherit"
                            onClick={() => setAddingWorkspace(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                />
            )}
        </BreadcrumbsContext.Provider>
    );
};
