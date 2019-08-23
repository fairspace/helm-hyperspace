import React, {useContext} from 'react';
import {withStyles} from '@material-ui/core/styles';
import {
    TableSortLabel, TablePagination, Table, TableBody,
    TableCell, TableHead, TableRow, Paper, FormGroup, FormControlLabel, Checkbox, Grid
} from '@material-ui/core';

import UsersContext from '../common/contexts/UsersContext';
import {
    isWorkspaceUser, isWorkspaceCoordinator, isWorkspaceDatasteward,
    isWorkspaceSparql, isOrganisationAdmin
} from '../common/utils/userUtils';
import Config from "../common/services/Config/Config";
import useSorting from '../common/hooks/UseSorting';
import usePagination from '../common/hooks/UsePagination';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    table: {
        tableLayout: 'fixed'
    }
});

const columns = {
    name: {
        valueExtractor: 'name',
        label: 'Name'
    }
};

const Roles = ({classes, workspace = 'workspace-ci'}) => {
    const {users, usersError, usersLoading} = useContext(UsersContext);

    const usersWithNames = users.map(u => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`
    }));
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(usersWithNames, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

    // const isCoordinator = (user) => isWorkspaceCoordinator(user.roles, workspace, Config.get());

    // users.forEach(u => {
    //     console.log({roles: buildUserRoles(u.roles, workspace, Config.get())});
    // });

    return (
        <Paper className={classes.root}>
            <Table className={classes.table}>
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
                        <TableCell>
                            Roles
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {
                        pagedItems.map(({id, name, roles}) => (
                            <TableRow key={id}>
                                <TableCell component="th" scope="row">
                                    {name}
                                </TableCell>
                                <TableCell>
                                    <FormGroup>
                                        <Grid container>
                                            <Grid item xs="6">
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={isOrganisationAdmin(roles, workspace, Config.get())}
                                                            value="Admin"
                                                            disabled
                                                        />
                                                    )}
                                                    label="Admin"
                                                />
                                            </Grid>
                                            <Grid item xs="6">
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={isWorkspaceCoordinator(roles, workspace, Config.get())}
                                                            value="Coordinator"
                                                            disabled
                                                        />
                                                    )}
                                                    label="Coordinator"
                                                />
                                            </Grid>
                                            <Grid item xs="6">
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={isWorkspaceUser(roles, workspace, Config.get())}
                                                            value="User"
                                                        />
                                                    )}
                                                    label="User"
                                                />
                                            </Grid>
                                            <Grid item xs="6">
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={isWorkspaceDatasteward(roles, workspace, Config.get())}
                                                            value="DataSteward"
                                                        />
                                                    )}
                                                    label="DataSteward"
                                                />
                                            </Grid>
                                            <Grid item xs="6">
                                                <FormControlLabel
                                                    control={(
                                                        <Checkbox
                                                            checked={isWorkspaceSparql(roles, workspace, Config.get())}
                                                            value="SAPRQL"
                                                        />
                                                    )}
                                                    label="SAPRQL"
                                                />
                                            </Grid>
                                        </Grid>
                                        {/* {
                                            Object.keys(AllRoles).map(role => (
                                                <FormControlLabel
                                                    key={role}
                                                    control={(
                                                        <Checkbox
                                                            checked={userHasRole(AllRoles[role], roles, workspace, Config.get())}
                                                            value={role}
                                                        />
                                                    )}
                                                    label={AllRoles[role]}
                                                />
                                            ))
                                        } */}
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
    );
};

export default withStyles(styles)(Roles);
