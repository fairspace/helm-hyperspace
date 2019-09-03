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

const columns = {
    name: {
        valueExtractor: 'name',
        label: 'Name'
    },
    description: {
        valueExtractor: 'description',
        label: 'Description'
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

    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(workspaces, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);
    const {currentUser: {authorizations}} = useContext(UserContext);

    const handleMenuClick = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const openWorkspaceRoles = (workspace) => {
        history.push(`workspaces/${workspace}/roles`);
    };

    const canManageRoles = (workspace) => !(isOrganisationAdmin(authorizations) || isWorkspaceCoordinator(authorizations, workspace));

    const gotoWorkspace = (workspace, url) => {
        if (isWorkspaceUser(authorizations, workspace)) {
            window.location.href = url
        }
    };

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
                                active={orderBy === 'description'}
                                direction={orderAscending ? 'asc' : 'desc'}
                                onClick={() => toggleSort('description')}
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
                    {pagedItems.map(({name, description, url, version, status}) => {
                        const actionsButtonId = name + 'ActionsBtn';

                        return (
                            <TableRow
                                hover
                                key={name}
                                onDoubleClick={() => gotoWorkspace(name, url) }
                            >
                                <TableCell>
                                    {name}
                                </TableCell>
                                <TableCell>
                                    {description}
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
                                            disabled={canManageRoles(name)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            id="actions-menu"
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl) && anchorEl.id === actionsButtonId}
                                            onClose={handleMenuClose}
                                        >
                                            <MenuItem onClick={() => openWorkspaceRoles(name)}>
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
