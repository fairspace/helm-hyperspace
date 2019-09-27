import React from "react";
import {IconButton, Snackbar} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

export default ({
    open = true,
    onClose = () => {},
    autoHideDuration = 6000,
    message
}) => (
    <Snackbar
        open={open}
        onClose={onClose}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        message={<span>{message}</span>}
        autoHideDuration={autoHideDuration}
        action={(
            <IconButton
                aria-label="Close"
                color="inherit"
                onClick={onClose}
            >
                <CloseIcon />
            </IconButton>
        )}
    />
);
