import React, {useState, useEffect} from 'react';
import {
    Button, Dialog, DialogContent, DialogTitle,
    DialogActions, TextField, Typography
} from '@material-ui/core';

const WorkspaceDeletionDialog = ({open, workspaceId, onClose, onConfirm}) => {
    const [enteredWorkspaceId, setEnteredWorkspaceId] = useState('');

    // reset user input
    useEffect(() => {
        setEnteredWorkspaceId('');
    }, [open, workspaceId]);

    const enteredWorkspaceIdMatch = enteredWorkspaceId === workspaceId;

    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogContent>
                <Typography
                    variant="inherit"
                >
                    This is a permanent action and cannot be undone.
                    It will remove the given workspace including all of its files, metadata and users.
                </Typography>
                <TextField
                    label="Please type in the workspace id"
                    value={enteredWorkspaceId}
                    onChange={(e) => setEnteredWorkspaceId(e.target.value)}
                    margin="normal"
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={!enteredWorkspaceIdMatch}
                >
                    <Typography
                        variant="inherit"
                        color={enteredWorkspaceIdMatch ? 'error' : 'textSecondary'}
                    >
                        Delete workspace forever
                    </Typography>
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkspaceDeletionDialog;
