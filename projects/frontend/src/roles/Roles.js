import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {
    withStyles, TableSortLabel, TablePagination, Table, TableBody,
    TableCell, TableHead, TableRow, Paper, FormGroup, FormControlLabel,
    Checkbox, Grid, Typography, Button,
} from '@material-ui/core';

import Config from "../common/services/Config/Config";
import {
    isWorkspaceUser, isWorkspaceCoordinator, isWorkspaceDatasteward,
    isWorkspaceSparql, isOrganisationAdmin, idToRoles
} from '../common/utils/userUtils';
import useSorting from '../common/hooks/UseSorting';
import usePagination from '../common/hooks/UsePagination';

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

const Roles = ({classes, workspace, users, canManageCoordinators = false}) => {
    const [usersRolesMapping, setUsersRolesMapping] = useState(users.reduce(idToRoles, {}));
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(users, columns, 'firstName');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);
    const [fromDirty, setFromDirty] = useState(false);

    const handleChange = (id) => (event) => {
        setFromDirty(true);
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

    const {roles, rolesPrefixes} = Config.get();

    const RoleCheckbox = ({userId, label, roleChecker, value, disabled}) => (
        <Grid item xs={4}>
            <FormControlLabel
                control={(
                    <Checkbox
                        className={classes.roleCheckbox}
                        checked={roleChecker(Array.from(usersRolesMapping[userId] || {}), workspace)}
                        onChange={handleChange(userId)}
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
                                                    label="Admin"
                                                    roleChecker={isOrganisationAdmin}
                                                    value={roles.organisationAdmin}
                                                    disabled
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="Coordinator"
                                                    roleChecker={isWorkspaceCoordinator}
                                                    value={rolesPrefixes.coordinator + workspace}
                                                    disabled={!canManageCoordinators}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="User"
                                                    roleChecker={isWorkspaceUser}
                                                    value={rolesPrefixes.user + workspace}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="Data steward"
                                                    roleChecker={isWorkspaceDatasteward}
                                                    value={rolesPrefixes.datasteward + workspace}
                                                />
                                                <RoleCheckbox
                                                    userId={id}
                                                    label="SAPRQL"
                                                    roleChecker={isWorkspaceSparql}
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
                disabled={!fromDirty}
            >
                Save Changes
            </Button>
        </>
    );
};


Roles.propTypes = {
    classes: PropTypes.shape(),
    users: PropTypes.array.isRequired,
    workspace: PropTypes.string.isRequired,
    canManageCoordinators: PropTypes.bool,
};

export default withRouter(withStyles(styles)(Roles));
