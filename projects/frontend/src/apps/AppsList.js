import React from 'react';
import PropTypes from 'prop-types';
import {
    Button, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel
} from '@material-ui/core';
import {Delete} from "@material-ui/icons";
import {useSorting} from "@fairspace/shared-frontend";
import BreadCrumbs from "../common/components/BreadCrumbs";
import ConfirmationButton from "../common/components/ConfirmationButton";
import AppsBreadcrumbsContextProvider from "./AppsBreadcrumbsContextProvider";
import ErrorDialog from "../common/components/ErrorDialog";
import {APP_TYPE_JUPYTER} from "../constants";

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
        valueExtractor: 'status',
        label: 'Status'
    }
};

const AppsList = ({apps, workspaceId, onAddApp, onRemoveApp}) => {
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(apps, columns, 'type');
    const isAppInstalled = appType => apps.some(app => app.type === appType);

    const addApp = appType => onAddApp(appType).catch(e => ErrorDialog.showError(e, "Error adding a " + appType + " app to this workspace"));
    const removeApp = appId => onRemoveApp(appId).catch(e => ErrorDialog.showError(e, "Error removing app " + appId + " from the workspace"));

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
                        {orderedItems.map(({id, type, url, version, status}) => (
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
                                    {status}
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
        </AppsBreadcrumbsContextProvider>
    );
};

AppsList.propTypes = {
    workspace: PropTypes.shape({
        apps: PropTypes.array
    }),
};

export default AppsList;
