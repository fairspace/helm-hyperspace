import React, {useState, useContext} from 'react';
import {withRouter} from "react-router-dom";
import {
    Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel, IconButton, Menu, MenuItem
} from "@material-ui/core";
import MoreVertIcon from '@material-ui/icons/MoreVert';

import useSorting from "../common/hooks/UseSorting";
import usePagination from "../common/hooks/UsePagination";
import MessageDisplay from "../common/components/MessageDisplay";
import WorkspaceAPI from "./WorkspaceAPI";
import LoadingInlay from "../common/components/LoadingInlay";
import useRepeat from "../common/hooks/UseRepeat";
import useAsync from "../common/hooks/UseAsync";
import UserContext from '../common/contexts/UserContext';
import {isOrganisationAdmin, isWorkspaceCoordinator, isWorkspaceUser} from '../common/utils/userUtils';
import Icon from "@material-ui/core/Icon";

const columns = {
    access: {
        valueExtractor: 'access',
        label: 'Access'
    },
    description: {
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

const WorkspaceList = ({history}) => {
    const {data: workspaces = [], loading, error, refresh} = useAsync(WorkspaceAPI.getWorkspaces);
    const [anchorEl, setAnchorEl] = useState(null);

    // refresh every 30 seconds
    useRepeat(refresh, 30000);

    const {currentUser: {authorizations}} = useContext(UserContext);
    const workspacesWithAccess = workspaces.map(ws => ({...ws, access: isWorkspaceUser(authorizations, ws.name)}))
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

    const canManageRoles = (workspaceId) => !(isOrganisationAdmin(authorizations) || isWorkspaceCoordinator(authorizations, workspaceId));


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
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pagedItems.map(({access, id, name, url, version, status}) => {
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
                                    {!access && <Icon>lock</Icon>}
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
                                    <>
                                        <IconButton
                                            id={actionsButtonId}
                                            aria-label="Roles"
                                            aria-owns={anchorEl ? 'actions-menu' : undefined}
                                            aria-haspopup="true"
                                            onClick={handleMenuClick}
                                            disabled={canManageRoles(id)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            id="actions-menu"
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl) && anchorEl.id === actionsButtonId}
                                            onClose={handleMenuClose}
                                        >
                                            <MenuItem onClick={() => openWorkspaceRoles(id)}>
                                                Manage Roles
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
