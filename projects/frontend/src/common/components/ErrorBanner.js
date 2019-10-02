import React from 'react';
import PropTypes from 'prop-types';
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import WarningIcon from "@material-ui/icons/WarningOutlined";
import withStyles from "@material-ui/core/styles/withStyles";

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

const ErrorBanner = ({classes, onDismiss, onRefresh, message, showRefreshButton = false}) => {
    const dismissButton = <Button className={classes.button} color="primary" onClick={onDismiss}>Dismiss</Button>;

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
                <Grid container justify="flex-end" spacing={8}>
                    <Grid item>
                        {dismissButton}
                        {showRefreshButton
                            ? <Button className={classes.button} color="primary" variant="outlined" onClick={onRefresh}>Retry</Button>
                            : undefined}
                    </Grid>
                </Grid>
            </Paper>
            <Divider />
        </>
    );
};

ErrorBanner.propTypes = {
    onDismiss: PropTypes.func,
    onRefresh: PropTypes.func,
    message: PropTypes.string,
    showRefreshButton: PropTypes.bool
};

export default withStyles(styles)(ErrorBanner);
