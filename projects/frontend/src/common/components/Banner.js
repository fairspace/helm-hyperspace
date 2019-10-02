import React from "react";
import Grid from "@material-ui/core/Grid";
import CssBaseline from "@material-ui/core/CssBaseline";
import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import SignalWifiOffIcon from "@material-ui/icons/SignalWifiOff";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import {withStyles} from "@material-ui/core";

const styles = theme => ({
    paper: {
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit}px ${theme.spacing.unit}px ${theme.spacing.unit * 2}px`
    },
    avatar: {
        backgroundColor: theme.palette.primary.main
    }
});

function Banner({classes, icon}) {
    return (
        <>
            <Paper elevation={0} className={classes.paper}>
                <Grid container wrap="nowrap" spacing={16} alignItems="center">
                    {icon
                        ? <Grid item>
                            <Avatar className={classes.avatar}>
                                icon
                            </Avatar>
                        </Grid>
                        : undefined}
                    <Grid item>
                        <Typography>
                            You have lost connection to the internet. This app is offline.
                        </Typography>
                    </Grid>
                </Grid>
                <Grid container justify="flex-end" spacing={8}>
                    <Grid item>
                        <Button color="primary">Turn on wifi</Button>
                    </Grid>
                </Grid>
            </Paper>
            <Divider />
            <CssBaseline />
        </>
    );
}

export default withStyles(styles)(Banner);
