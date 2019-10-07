import React, {useState, useContext} from 'react';
import {Link, withRouter} from "react-router-dom";
import {
    Paper, Table, TableBody, TableCell, TableHead,
    TablePagination, TableRow, TableSortLabel, IconButton,
    Menu, MenuItem, Tooltip, Typography, Grid,
} from "@material-ui/core";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ErrorIcon from '@material-ui/icons/Error';
import Lock from '@material-ui/icons/Lock';
import withStyles from "@material-ui/core/styles/withStyles";
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
        valueExtractor: w => w.release.status,
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

export const WorkspaceList = ({classes, history, onEditWorkspace, getWorkspaces = WorkspaceAPI.getWorkspaces}) => {
    const {data: workspaces = [], loading, error, refresh} = useAsync(getWorkspaces);
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

    const isAdmin = isOrganisationAdmin(authorizations);

    const canManageRoles = (workspaceId) => isAdmin || isWorkspaceCoordinator(authorizations, workspaceId);

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
                        const {access, id, name, url, version, release: {ready, status}, apps = []} = workspace;
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
                                    <Grid container alignItems="center" spacing={8}>
                                        <Grid item xs={11}>{status}</Grid>
                                        <Grid item xs={1}>
                                            {!ready && <Link to={`/workspaces/${id}`} className={classes.warning}><ErrorIcon fontSize="small" /></Link>}
                                        </Grid>
                                    </Grid>
                                </TableCell>
                                <TableCell>
                                    {apps.find(app => app.type === APP_TYPE_JUPYTER) && <JupyterIcon style={{height: 36}} />}
                                </TableCell>
                                <TableCell>
                                    <>
                                        <IconButton
                                            id={actionsButtonId}
                                            data-testid="actions-buttton"
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
                                            <MenuItem
                                                data-testid="config-menu-item"
                                                onClick={() => {
                                                    setAnchorEl(undefined);
                                                    onEditWorkspace(workspace);
                                                }}
                                                disabled={!isAdmin || !ready}
                                            >
                                                Update configuration
                                            </MenuItem>
                                            <MenuItem
                                                data-testid="roles-menu-item"
                                                onClick={() => openWorkspaceRoles(id)}
                                                disabled={!canManageRoles(id) || !ready}
                                            >
                                                Manage roles
                                            </MenuItem>
                                            <MenuItem
                                                data-testid="apps-menu-item"
                                                onClick={() => manageApps(id)}
                                                disabled={!isAdmin || !ready}
                                            >
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

export default withStyles(styles)(withRouter(WorkspaceList));
