import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {
    withStyles, TableSortLabel, TablePagination, Table, TableBody,
    TableCell, TableHead, TableRow, Paper, FormGroup, FormControlLabel,
    Checkbox, Grid, Typography, Button,
} from '@material-ui/core';
import {useSorting, usePagination} from '@fairspace/shared-frontend';

import Config from "../common/services/Config/Config";
import {
    isWorkspaceUser, isWorkspaceCoordinator, isWorkspaceDatasteward,
    isWorkspaceSparql, idToRoles
} from '../common/utils/userUtils';

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

const RolesList = ({classes, workspace, users, canManageCoordinators = false}) => {
    // The state would look like: {"user-id": Set()} where the set contains the roles
    const [usersRolesMapping, setUsersRolesMapping] = useState(users.reduce(idToRoles, {}));
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(users, columns, 'firstName');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (event, id) => {
        setIsDirty(true);
        const roles = usersRolesMapping[id];

        if (event.target.checked) {
            roles.add(event.target.value);
        } else {
            roles.delete(event.target.value);
        }

        setUsersRolesMapping(prev => ({
            ...prev,
            [id]: roles
        }));
    };

    const {rolesPrefixes} = Config.get();

    const RoleCheckbox = ({checked, onChange, label, value, disabled}) => (
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

    return (
        <>
            <Typography variant="h5" className={classes.header}>
                {workspace}
            </Typography>
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
                            pagedItems.map(({id, firstName, lastName}) => (
                                <TableRow key={id}>
                                    <TableCell component="th" scope="row">
                                        {`${firstName} ${lastName}`}
                                    </TableCell>
                                    <TableCell>
                                        <FormGroup>
                                            <Grid container>
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="Coordinator"
                                                    checked={isWorkspaceCoordinator(Array.from(usersRolesMapping[id] || {}), workspace)}
                                                    onChange={(e) => handleChange(e, id)}
                                                    value={rolesPrefixes.coordinator + workspace}
                                                    disabled={!canManageCoordinators}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="User"
                                                    checked={isWorkspaceUser(Array.from(usersRolesMapping[id] || {}), workspace)}
                                                    onChange={(e) => handleChange(e, id)}
                                                    value={rolesPrefixes.user + workspace}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="Data steward"
                                                    checked={isWorkspaceDatasteward(Array.from(usersRolesMapping[id] || {}), workspace)}
                                                    onChange={(e) => handleChange(e, id)}
                                                    value={rolesPrefixes.datasteward + workspace}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="SAPRQL"
                                                    checked={isWorkspaceSparql(Array.from(usersRolesMapping[id] || {}), workspace)}
                                                    onChange={(e) => handleChange(e, id)}
                                                    value={rolesPrefixes.sparql + workspace}
                                                />
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
                variant="contained"
                color="primary"
                disabled={!isDirty}
            >
                Save Changes
            </Button>
        </>
    );
};


RolesList.propTypes = {
    classes: PropTypes.shape(),
    users: PropTypes.array.isRequired,
    workspace: PropTypes.string.isRequired,
    canManageCoordinators: PropTypes.bool,
};

export default withRouter(withStyles(styles)(RolesList));
