import React, {useEffect, useState} from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import {withStyles} from '@material-ui/core/styles';
import UserSelect from "./UserSelect";

export const styles = () => ({
    root: {
        width: 400,
        height: 350,
        display: 'block',
    },
    rootEdit: {
        width: 400,
        display: 'block',
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    formControl: {
        marginTop: 20,
    },
    autocomplete: {
        width: '100%'
    },
});

const AddUserDialog = ({classes, open, users, onSubmit, onClose, currentUser = {}}) => {
    const [user, setUser] = useState();

    useEffect(() => {
        setUser();
    }, [open]);

    const isOptionDisabled = option => {
        const isAlreadySelected = users.find(u => u.id === option.id) !== undefined;
        const isCurrentUser = option.id === currentUser.id;
        return isAlreadySelected || isCurrentUser;
    };

    const handleSubmit = () => {
        onSubmit(user)
            .then(onClose);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle id="scroll-dialog-title">Add user to workspace</DialogTitle>
            <DialogContent>
                <div className={user ? classes.rootEdit : classes.root}>
                    <UserSelect
                        onChange={setUser}
                        placeholder="Please select a user"
                        value={user}
                        isOptionDisabled={isOptionDisabled}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    disabled={!user}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles, {withTheme: true})(AddUserDialog);
