import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Link} from "react-router-dom";
import withStyles from "@material-ui/core/styles/withStyles";
import {
    Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel
} from '@material-ui/core';
import Delete from "@material-ui/icons/Delete";
import ErrorIcon from '@material-ui/icons/Error';

import {BreadCrumbs, ConfirmationButton, useSorting} from "@fairspace/shared-frontend";
import {APP_TYPE_JUPYTER} from "../constants";
import AppsBreadcrumbsContextProvider from "./AppsBreadcrumbsContextProvider";
import NotificationSnackbar from "../common/components/NotificationSnackbar";

const columns = {
    id: {
        valueExtractor: 'id',
        label: 'Id'
    },
    type: {
        valueExtractor: 'type',
        label: 'Type'
    },
    version: {
        valueExtractor: 'version',
        label: 'Version'
    },
    status: {
        valueExtractor: a => a.release.status,
        label: 'Status'
    }
};

const styles = theme => ({
    warning: {
        color: theme.palette.error.main,
        verticalAlign: "middle",
        marginLeft: theme.spacing.unit
    }
});

const AppsList = ({classes, apps, workspaceId, onAddApp, onRemoveApp}) => {
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(apps, columns, 'type');
    const isAppInstalled = appType => apps.some(app => app.type === appType);

    const addApp = appType => {
        onAddApp(appType)
            .then(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("Your " + appType + " app is being added to the workspace, this might take a while for it to appear");
            })
            .catch(e => {
                setSnackbarVisible(true);
                setSnackbarMessage("Error adding a " + appType + " app to this workspace");
            });
    };

    const removeApp = appId => {
        onRemoveApp(appId)
            .then(() => {
                setSnackbarVisible(true);
                setSnackbarMessage("Your app " + appId + " is being removed from the workspace. It might take a while for it to disappear");
            })
            .catch(e => {
                setSnackbarVisible(true);
                setSnackbarMessage("Error removing the " + appId + " app from this workspace");
            });
    }

    return (
        <AppsBreadcrumbsContextProvider workspaceId={workspaceId}>
            <BreadCrumbs />
            <Paper>
                <Table style={{tableLayout: 'fixed'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'id'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('id')}
                                >
                                    Id
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'type'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('type')}
                                >
                                    Type
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'version'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('version')}
                                >
                                    Version
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'status'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('status')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orderedItems.map(({id, type, url, version, release}) => (
                            <TableRow
                                hover
                                key={id}
                                onDoubleClick={() => {
                                    if (url) window.location.href = url;
                                }}
                            >
                                <TableCell>
                                    {id}
                                </TableCell>
                                <TableCell>
                                    {type}
                                </TableCell>
                                <TableCell>
                                    {version}
                                </TableCell>
                                <TableCell>
                                    {release.status}
                                    {
                                        release.ready
                                            ? ''
                                            : <Link to={`/workspaces/${workspaceId}/apps/${id}`} className={classes.warning}><ErrorIcon fontSize="small" /></Link>
                                    }
                                </TableCell>
                                <TableCell>
                                    <ConfirmationButton
                                        onClick={() => removeApp(id)}
                                        message="Are you sure you want to remove this app from the workspace?"
                                    >
                                        <IconButton>
                                            <Delete />
                                        </IconButton>
                                    </ConfirmationButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <ConfirmationButton
                onClick={() => addApp(APP_TYPE_JUPYTER)}
                disabled={isAppInstalled(APP_TYPE_JUPYTER)}
                message="Are you sure you want to add jupyter to this workspace?"
            >
                <Button
                    style={{marginTop: 8}}
                    color="primary"
                    variant="contained"
                    aria-label="Add"
                    title="Add jupyter to workspace"
                    disabled={isAppInstalled(APP_TYPE_JUPYTER)}
                >
                    Add jupyter
                </Button>
            </ConfirmationButton>

            <NotificationSnackbar
                open={snackbarVisible}
                onClose={() => setSnackbarVisible(false)}
                message={snackbarMessage}
            />
        </AppsBreadcrumbsContextProvider>
    );
};

AppsList.propTypes = {
    workspace: PropTypes.shape({
        apps: PropTypes.array
    }),
};

export default withStyles(styles)(AppsList);
