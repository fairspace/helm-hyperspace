import React, {useState, useContext} from 'react';
import {withRouter} from "react-router-dom";
import {
    Paper, Table, TableBody, TableCell, TableHead,
    TablePagination, TableRow, TableSortLabel, IconButton,
    Menu, MenuItem, Tooltip, Typography,
} from "@material-ui/core";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Lock from '@material-ui/icons/Lock';
import {
    LoadingInlay, MessageDisplay, UserContext, useSorting,
    usePagination, useAsync,
} from '@fairspace/shared-frontend';

import WorkspaceAPI from "../common/services/WorkspaceAPI";
import useRepeat from "../common/hooks/UseRepeat";
import {isOrganisationAdmin, isWorkspaceCoordinator, isWorkspaceUser} from '../common/utils/userUtils';
import JupyterIcon from "../common/components/apps/JupyterIcon";
import {APP_TYPE_JUPYTER} from "../constants";

const columns = {
    access: {
        valueExtractor: 'access',
        label: 'Access'
    },
    id: {
        valueExtractor: 'id',
        label: 'Id'
    },
    name: {
        valueExtractor: 'name',
        label: 'Name'
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

const WorkspaceList = ({history, onEditWorkspace}) => {
    const {data: workspaces = [], loading, error, refresh} = useAsync(WorkspaceAPI.getWorkspaces);
    const [anchorEl, setAnchorEl] = useState(null);

    // refresh every 30 seconds
    useRepeat(refresh, 30000);

    const {currentUser: {authorizations}} = useContext(UserContext);
    const workspacesWithAccess = workspaces.map(ws => ({...ws, access: isWorkspaceUser(authorizations, ws.id)}));
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(workspacesWithAccess, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

    const handleMenuClick = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const openWorkspaceRoles = (workspaceId) => {
        history.push(`workspaces/${workspaceId}/roles`);
    };

    const manageApps = (workspaceId) => {
        history.push(`workspaces/${workspaceId}/apps`);
    };

    const canManageRoles = (workspaceId) => isOrganisationAdmin(authorizations) || isWorkspaceCoordinator(authorizations, workspaceId);
    const canManageApps = () => isOrganisationAdmin(authorizations);

    if (loading) {
        return <LoadingInlay />;
    }

    if (error) {
        return <MessageDisplay message="An error occurred while loading workspaces" />;
    }

    return (
        <Paper>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell padding="dense">
                            <TableSortLabel
                                active={orderBy === 'access'}
                                direction={orderAscending ? 'asc' : 'desc'}
                                onClick={() => toggleSort('access')}
                            />
                        </TableCell>
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
                                active={orderBy === 'name'}
                                direction={orderAscending ? 'asc' : 'desc'}
                                onClick={() => toggleSort('name')}
                            >
                                Name
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
                        <TableCell>
                            Apps
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pagedItems.map((workspace) => {
                        const {access, id, name, url, version, status, apps = []} = workspace;
                        const actionsButtonId = name + 'ActionsBtn';

                        return (
                            <TableRow
                                hover
                                key={name}
                                onDoubleClick={() => {
                                    if (access) window.location.href = url;
                                }}
                            >
                                <TableCell padding="dense">
                                    {!access && (
                                        <Tooltip
                                            title={(
                                                <Typography
                                                    variant="caption"
                                                    color="inherit"
                                                    style={{whiteSpace: 'pre-line'}}
                                                >
                                                    You have no access to this workspace
                                                </Typography>
                                            )}
                                        >
                                            <Lock />
                                        </Tooltip>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {id}
                                </TableCell>
                                <TableCell>
                                    {name}
                                </TableCell>
                                <TableCell>
                                    {version}
                                </TableCell>
                                <TableCell>
                                    {status}
                                </TableCell>
                                <TableCell>
                                    {apps.find(app => app.type === APP_TYPE_JUPYTER) && <JupyterIcon style={{height: 36}} />}
                                </TableCell>
                                <TableCell>
                                    <>
                                        <IconButton
                                            id={actionsButtonId}
                                            aria-label="Roles"
                                            aria-owns={anchorEl ? 'actions-menu' : undefined}
                                            aria-haspopup="true"
                                            onClick={handleMenuClick}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            id="actions-menu"
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl) && anchorEl.id === actionsButtonId}
                                            onClose={handleMenuClose}
                                        >
                                            <MenuItem onClick={() => {
                                                setAnchorEl(undefined);
                                                onEditWorkspace(workspace);
                                            }} disabled={!isOrganisationAdmin(authorizations)}>
                                                Update configuration
                                            </MenuItem>
                                            <MenuItem onClick={() => openWorkspaceRoles(id)} disabled={!canManageRoles(id)}>
                                                Manage roles
                                            </MenuItem>
                                            <MenuItem onClick={() => manageApps(id)} disabled={!canManageApps(id)}>
                                                Manage apps
                                            </MenuItem>
                                        </Menu>
                                    </>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 100]}
                component="div"
                count={workspaces.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={(e, p) => setPage(p)}
                onChangeRowsPerPage={e => setRowsPerPage(e.target.value)}
            />
        </Paper>
    );
};

export default withRouter(WorkspaceList);
