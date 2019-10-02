import React, {useContext, useState} from 'react';
import {Button} from "@material-ui/core";
import {BreadCrumbs, BreadcrumbsContext, usePageTitleUpdater, UserContext} from '@fairspace/shared-frontend';

import WorkspaceList from "./WorkspaceList";
import WorkspaceDialog from "./WorkspaceDialog";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import {isOrganisationAdmin} from "../common/utils/userUtils";
import NotificationSnackbar from "../common/components/NotificationSnackbar";

export default () => {
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState();

    usePageTitleUpdater("Workspaces");

    const createWorkspace = (workspace) => {
        setShowWorkspaceDialog(false);
        setSelectedWorkspace(undefined);
        return WorkspaceAPI.createWorkspace(workspace)
            .then(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("The workspace is being created, this might take a while");
            })
            .catch(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("An error occurred while creating your workspace. Please try again later.");
            });
    };

    const updateWorkspace = (workspace) => {
        setShowWorkspaceDialog(false);
        setSelectedWorkspace(undefined);
        return WorkspaceAPI.updateWorkspace(workspace)
            .then(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("The workspace is being updated, this might take a while");
            })
            .catch(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("An error occurred while updating your workspace. Please try again later.");
            });
    };

    const {currentUser: {authorizations}} = useContext(UserContext);

    const editWorkspace = (workspace) => {
        setSelectedWorkspace(workspace);
        setShowWorkspaceDialog(true);
    };

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
            <WorkspaceList onEditWorkspace={editWorkspace}/>
            <Button
                style={{marginTop: 8}}
                color="primary"
                variant="contained"
                aria-label="Add"
                title="Create a new workspace"
                disabled={showWorkspaceDialog || !isOrganisationAdmin(authorizations)}
                onClick={() => setShowWorkspaceDialog(true)}
            >
                Add New Workspace
            </Button>
            {showWorkspaceDialog && (
                <WorkspaceDialog
                    onSubmit={selectedWorkspace ? updateWorkspace : createWorkspace}
                    onClose={() => {
                        setShowWorkspaceDialog(false);
                        setSelectedWorkspace(undefined);
                    }}
                    workspace={selectedWorkspace}
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
