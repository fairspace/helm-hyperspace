import React, {useContext, useState} from 'react';
import {Button} from "@material-ui/core";
import {BreadCrumbs, BreadcrumbsContext, usePageTitleUpdater, UserContext} from '@fairspace/shared-frontend';

import WorkspaceList from "./WorkspaceList";
import NewWorkspaceDialog from "./NewWorkspaceDialog";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import {isOrganisationAdmin} from "../common/utils/userUtils";
import NotificationSnackbar from "../common/components/NotificationSnackbar";

export default () => {
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    usePageTitleUpdater("Workspaces");

    const createWorkspace = (workspace) => {
        setShowNewWorkspaceDialog(false);
        return WorkspaceAPI.createWorkspace(workspace)
            .then(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("The workspace is being created, this might take a while");
            })
            .catch(e => {
                console.error('Error creating a workspace', e);
                setSnackbarVisible(true);
                setSnackbarMessage("An error occurred while creating your workspace. Please check the logs.");
            });
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
                Add a New Workspace
            </Button>
            {showNewWorkspaceDialog && (
                <NewWorkspaceDialog
                    onCreate={createWorkspace}
                    onClose={() => setShowNewWorkspaceDialog(false)}
                />
            )}
            <NotificationSnackbar
                open={snackbarVisible}
                onClose={() => setSnackbarVisible(false)}
                message={snackbarMessage}
            />

        </BreadcrumbsContext.Provider>
    );
};
