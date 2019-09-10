import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {
    Checkbox, FormControlLabel, FormGroup, Grid, Paper, Table, TableBody, TableCell, TableHead, TablePagination,
    TableRow, TableSortLabel, Button, withStyles
} from '@material-ui/core';
import useSorting from '../common/hooks/UseSorting';
import usePagination from '../common/hooks/UsePagination';
import BreadCrumbs from "../common/components/BreadCrumbs";
import RolesBreadcrumbsContextProvider from "./RolesBreadcrumbsContextProvider";
import AddUserDialog from "./AddUserDialog";

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

const columns = {
    firstName: {
        valueExtractor: 'firstName',
        label: 'Name'
    }
};

const RoleCheckbox = ({classes, checked, onChange, label, value, disabled}) => (
    <Grid item xs={4}>
        <FormControlLabel
            control={(
                <Checkbox
                    className={classes.roleCheckbox}
                    checked={checked}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            )}
            label={label}
        />
    </Grid>
);

const RolesList = ({classes, workspace, currentUser, users = [], roles = {}, update = () => {}, canManageCoordinators = false}) => {
    const [dialogOpen, showDialog] = useState(false);
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(users, columns, 'firstName');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

    const isRoleDisabled = role => {
        if (role === 'coordinator') return !canManageCoordinators;
        return false;
    };

    return (
        <RolesBreadcrumbsContextProvider workspace={workspace}>
            <BreadCrumbs />
            <Paper className={classes.tableRoot}>
                <Table style={{tableLayout: 'fixed'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'firstName'}
                                    direction={orderAscending ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('firstName')}
                                >
                                    User
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                Roles
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            pagedItems.map(({id, firstName, lastName, authorizations}) => (
                                <TableRow key={id}>
                                    <TableCell component="th" scope="row">
                                        {`${firstName} ${lastName}`}
                                    </TableCell>
                                    <TableCell>
                                        <FormGroup>
                                            <Grid container>
                                                {Object.keys(roles).map(role => (
                                                    <RoleCheckbox
                                                        classes={classes}
                                                        key={role}
                                                        userId={id}
                                                        label={role}
                                                        checked={authorizations[role]}
                                                        onChange={(e) => update(id, role, e.target.checked)}
                                                        disabled={isRoleDisabled(role)}
                                                    />
                                                ))}
                                            </Grid>
                                        </FormGroup>
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
                onSubmit={(user) => update(user.id, 'user', true)}
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
    workspace: PropTypes.string.isRequired,
    canManageCoordinators: PropTypes.bool,
    update: PropTypes.func
};

export default withRouter(withStyles(styles)(RolesList));
