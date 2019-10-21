import React, {useContext, useState} from 'react';
import {Button} from "@material-ui/core";
import {BreadCrumbs, BreadcrumbsContext, usePageTitleUpdater, UserContext} from '@fairspace/shared-frontend';

import WorkspaceList from "./WorkspaceList";
import WorkspaceDialog from "./WorkspaceDialog";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import {isOrganisationAdmin} from "../common/utils/userUtils";
import NotificationSnackbar from "../common/components/NotificationSnackbar";
import WorkspaceDeletionDialog from './WorkspaceDeletionDialog';

export default () => {
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState();
    const [workspaceIdToDelete, setWorkspaceIdToDelete] = useState('');

    const {currentUser: {authorizations}} = useContext(UserContext);

    usePageTitleUpdater("Workspaces");

    const createWorkspace = async (workspace) => {
        setShowWorkspaceDialog(false);
        setSelectedWorkspace(undefined);

        try {
            await WorkspaceAPI.createWorkspace(workspace);
            setSnackbarMessage("The workspace is being created, "
                + "it could take a few minutes before the workspace appears in the table, "
                + "and up to 10 minutes before it becomes accessible.");
        } catch (e) {
            setSnackbarMessage("An error occurred while creating your workspace. Please try again later.");
        }

        setSnackbarVisible(true);
    };

    const updateWorkspace = async (workspace) => {
        setShowWorkspaceDialog(false);
        setSelectedWorkspace(undefined);

        try {
            await WorkspaceAPI.updateWorkspace(workspace);
            setSnackbarMessage("The workspace is being updated, this might a few minutes before the changes take affect.");
        } catch (e) {
            setSnackbarMessage("An error occurred while updating your workspace. Please try again later.");
        }

        setSnackbarVisible(true);
    };

    const editWorkspace = (workspace) => {
        setSelectedWorkspace(workspace);
        setShowWorkspaceDialog(true);
    };

    const deleteWorkspace = async (workspaceId) => {
        try {
            await WorkspaceAPI.deleteWorkspace(workspaceId);
        } catch (e) {
            setSnackbarVisible(true);
            setSnackbarMessage("An error happened while deleting the workspace.");
        }
    };

    const handleWorkspaceDeletion = (workspaceId) => {
        setWorkspaceIdToDelete('');
        setSnackbarVisible(true);
        setSnackbarMessage(`The workspace ${workspaceId} is being deleted, it may take a while before it is completely removed from the system.`);
        deleteWorkspace(workspaceId);
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
            <WorkspaceList
                onEditWorkspace={editWorkspace}
                onDeleteWorkspace={(id) => setWorkspaceIdToDelete(id)}
            />
            <WorkspaceDeletionDialog
                open={!!workspaceIdToDelete}
                workspaceId={workspaceIdToDelete}
                onClose={() => setWorkspaceIdToDelete('')}
                onConfirm={() => handleWorkspaceDeletion(workspaceIdToDelete)}
            />
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
                autoHideDuration={null}
                message={snackbarMessage}
                onClose={() => setSnackbarVisible(false)}
            />

        </BreadcrumbsContext.Provider>
    );
};
