import React, {useContext} from 'react';
import {withRouter} from "react-router-dom";
import {
    withStyles, TableSortLabel, TablePagination, Table, TableBody,
    TableCell, TableHead, TableRow, Paper, FormGroup, FormControlLabel,
    Checkbox, Grid, Typography,
} from '@material-ui/core';
import queryString from 'query-string';

import UsersContext from '../common/contexts/UsersContext';
import {
    isWorkspaceUser, isWorkspaceCoordinator, isWorkspaceDatasteward,
    isWorkspaceSparql, isOrganisationAdmin
} from '../common/utils/userUtils';
import useSorting from '../common/hooks/UseSorting';
import usePagination from '../common/hooks/UsePagination';
import LoadingInlay from '../common/components/LoadingInlay';
import MessageDisplay from '../common/components/MessageDisplay';

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
    name: {
        valueExtractor: 'name',
        label: 'Name'
    }
};

// TODO: for testing
const Roles = ({classes, location: {search}}) => {
    const {workspace} = queryString.parse(search);
    const {users, usersError, usersLoading} = useContext(UsersContext);
    const usersWithNames = users.map(u => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`
    }));
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(usersWithNames, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

    if (!workspace || workspace.trim().length === 0) {
        return <MessageDisplay message="No workspace is provided." />;
    }

    if (usersLoading) {
        return <LoadingInlay />;
    }

    if (usersError) {
        return <MessageDisplay message="Unable to retrieve the list of users." />;
    }

    return (
        <>
            <Typography variant="h5" className={classes.header}>
                Managing {workspace}
            </Typography>
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
                                                <Grid item xs={6}>
                                                    <FormControlLabel
                                                        control={(
                                                            <Checkbox
                                                                className={classes.roleCheckbox}
                                                                checked={isOrganisationAdmin(roles, workspace)}
                                                                value="Admin"
                                                                disabled
                                                            />
                                                        )}
                                                        label="Admin"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <FormControlLabel
                                                        control={(
                                                            <Checkbox
                                                                className={classes.roleCheckbox}
                                                                checked={isWorkspaceCoordinator(roles, workspace)}
                                                                value="Coordinator"
                                                                disabled
                                                            />
                                                        )}
                                                        label="Coordinator"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <FormControlLabel
                                                        control={(
                                                            <Checkbox
                                                                className={classes.roleCheckbox}
                                                                checked={isWorkspaceUser(roles, workspace)}
                                                                value="User"
                                                            />
                                                        )}
                                                        label="User"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <FormControlLabel
                                                        control={(
                                                            <Checkbox
                                                                className={classes.roleCheckbox}
                                                                checked={isWorkspaceDatasteward(roles, workspace)}
                                                                value="DataSteward"
                                                            />
                                                        )}
                                                        label="DataSteward"
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <FormControlLabel
                                                        control={(
                                                            <Checkbox
                                                                className={classes.roleCheckbox}
                                                                checked={isWorkspaceSparql(roles, workspace)}
                                                                value="SAPRQL"
                                                            />
                                                        )}
                                                        label="SAPRQL"
                                                    />
                                                </Grid>
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
        </>
    );
};

export default withRouter(withStyles(styles)(Roles));
