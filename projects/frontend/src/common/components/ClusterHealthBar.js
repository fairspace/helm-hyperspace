import React from 'react';
import PropTypes from 'prop-types';
import {useAsync} from "@fairspace/shared-frontend";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import WarningIcon from "@material-ui/icons/WarningOutlined";
import withStyles from "@material-ui/core/styles/withStyles";
import ClusterAPI from "../services/ClusterAPI";
import useRepeat from "../hooks/UseRepeat";

const styles = theme => ({
    paper: {
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit}px ${theme.spacing.unit}px ${theme.spacing.unit * 2}px`
    },
    avatar: {
        backgroundColor: theme.palette.error.main
    },
    button: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit
    }
});

const ClusterHealthBar = ({classes, onDismiss}) => {
    let message;
    let action;
    const dismissButton = <Button className={classes.button} color="primary" onClick={onDismiss}>Dismiss</Button>;

    // Load cluster information on startup and refresh the cluster information regularly
    const {data, loading, error, refresh} = useAsync(ClusterAPI.getClusterInformation);
    useRepeat(refresh, 30000);

    if (loading) {
        // While loading, never show any message
        return null;
    }


    if (error) {
        message = "An error occurred while retrieving cluster information";
        action = (
            <>
                {dismissButton}
                <Button className={classes.button} color="primary" variant="outlined" onClick={refresh}>Retry</Button>
            </>
        );
    } else if (data.numUnschedulable) {
        message = "The cluster seems to have problems handling new workspaces. Workspace creation or app installations may fail. Please contact an administrator";
        action = dismissButton;
    } else {
        // If there are no unschedulable pods, don't show any message
        return null;
    }

    return (
        <>
            <Paper elevation={0} className={classes.paper}>
                <Grid container wrap="nowrap" spacing={16} alignItems="center">
                    <Grid item>
                        <Avatar className={classes.avatar}>
                            <WarningIcon />
                        </Avatar>
                    </Grid>
                    <Grid item>
                        <Typography>
                            {message}
                        </Typography>
                    </Grid>
                </Grid>
                {action
                    ? (
                        <Grid container justify="flex-end" spacing={8}>
                            <Grid item>
                                {action}
                            </Grid>
                        </Grid>
                    )
                    : undefined}
            </Paper>
            <Divider />
        </>
    );
};

ClusterHealthBar.propTypes = {
    onDismiss: PropTypes.func
};

export default withStyles(styles)(ClusterHealthBar);
