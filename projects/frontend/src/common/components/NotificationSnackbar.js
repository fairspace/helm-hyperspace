import React from "react";
import PropTypes from 'prop-types';
import {IconButton, Snackbar} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

const NotificationSnackbar = ({
    open = true, onClose = () => {},
    autoHideDuration = 6000, message
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

NotificationSnackbar.propTypes = {
    open: PropTypes.bool,
    autoHideDuration: PropTypes.number,
    message: PropTypes.node,
    onClose: PropTypes.func,
};

export default NotificationSnackbar;
