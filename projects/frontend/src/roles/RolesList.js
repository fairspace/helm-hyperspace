import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {
    Button, Checkbox, IconButton, Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow,
    TableSortLabel, withStyles
} from '@material-ui/core';
import {BreadCrumbs, ConfirmationButton, useSorting, usePagination} from '@fairspace/shared-frontend';

import {Delete} from "@material-ui/icons";

import RolesBreadcrumbsContextProvider from "./RolesBreadcrumbsContextProvider";
import AddUserDialog from "./AddUserDialog";
import {ROLE_COORDINATOR, ROLE_USER} from "../constants";

const styles = theme => ({
    header: {
        marginTop: theme.spacing.unit * 3,
        textAlign: 'center',
    },
    tableRoot: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    roleCheckbox: {
        padding: theme.spacing.unit
    },
});

const RolesList = ({classes, workspaceId, currentUser, users = [], roles = {}, update = () => {}, canManageCoordinators = false}) => {
    const rolesToShow = Object.keys(roles).filter(role => role !== ROLE_USER);

    // Define the columns to sort on. Users can sort on the name
    // as well as on whether or not the user has a specific role
    const columns = rolesToShow.reduce(
        (curr, role) => ({
            ...curr,
            [role]: {
                label: role,
                valueExtractor: row => row.authorizations[role]
            }
        }),
        {
            name: {
                valueExtractor: row => `${row.firstName} ${row.lastName}`,
                label: 'Name'
            }
        }
    );

    const [dialogOpen, showDialog] = useState(false);
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(users, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

    const isRoleDisabled = (userId, role) => {
        if (userId === currentUser.id) return true;
        if (role === ROLE_COORDINATOR) return !canManageCoordinators;
        return false;
    };

    // Remove all authorizations that the given user currently has
    const removeFromWorkspace = (id, authorizations) => Object.keys(authorizations)
        .filter(role => authorizations[role])
        .map(role => update(id, role, false));

    return (
        <RolesBreadcrumbsContextProvider workspaceId={workspaceId}>
            <BreadCrumbs />
            <Paper className={classes.tableRoot}>
                <Table style={{tableLayout: 'fixed'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('name')}
                                >
                                    User
                                </TableSortLabel>
                            </TableCell>
                            {rolesToShow.map(role => (
                                <TableCell key={role} align="center">
                                    <TableSortLabel
                                        active={orderBy === role}
                                        direction={orderAscending ? 'asc' : 'desc'}
                                        onClick={() => toggleSort(role)}
                                    >
                                        {role}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            pagedItems.map(({id, firstName, lastName, authorizations}) => (
                                <TableRow key={id}>
                                    <TableCell component="th" scope="row">
                                        {`${firstName} ${lastName}`}
                                    </TableCell>
                                    {rolesToShow
                                        .map(role => (
                                            <TableCell key={role} align="center">
                                                <Checkbox
                                                    key={role}
                                                    className={classes.roleCheckbox}
                                                    checked={authorizations[role]}
                                                    onChange={(e) => update(id, role, e.target.checked)}
                                                    disabled={isRoleDisabled(id, role)}
                                                />
                                            </TableCell>
                                        ))}
                                    <TableCell>
                                        <ConfirmationButton
                                            onClick={() => removeFromWorkspace(id, authorizations)}
                                            disabled={isRoleDisabled(id, ROLE_USER)}
                                            message="Are you sure you want to remove this user from the workspace?"
                                        >
                                            <IconButton>
                                                <Delete />
                                            </IconButton>
                                        </ConfirmationButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 100]}
                    component="div"
                    count={users.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={(e, p) => setPage(p)}
                    onChangeRowsPerPage={e => setRowsPerPage(e.target.value)}
                />
            </Paper>

            <Button
                style={{marginTop: 8}}
                color="primary"
                variant="contained"
                aria-label="Add"
                title="Add user to workspace"
                onClick={() => showDialog(true)}
            >
                New
            </Button>
            <AddUserDialog
                open={dialogOpen}
                users={users}
                currentUser={currentUser}
                onSubmit={(user) => update(user.id, ROLE_USER, true)}
                onClose={() => showDialog(false)}
            />

        </RolesBreadcrumbsContextProvider>
    );
};

RolesList.propTypes = {
    classes: PropTypes.object,
    users: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        username: PropTypes.string.isRequired,
        roles: PropTypes.arrayOf(PropTypes.string)
    })).isRequired,
    roles: PropTypes.object,
    workspaceId: PropTypes.string.isRequired,
    canManageCoordinators: PropTypes.bool,
    update: PropTypes.func
};

export default withRouter(withStyles(styles)(RolesList));
