import React, {useContext} from 'react';
import {
    Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel
} from "@material-ui/core";
import FolderOpen from "@material-ui/icons/FolderOpen";

import useSorting from "../common/hooks/UseSorting";
import usePagination from "../common/hooks/UsePagination";
import MessageDisplay from "../common/components/MessageDisplay";
import WorkspaceAPI from "./WorkspaceAPI";
import LoadingInlay from "../common/components/LoadingInlay";
import useRepeat from "../common/hooks/UseRepeat";
import useAsync from "../common/hooks/UseAsync";
import UserContext from "../common/contexts/UserContext";

const columns = {
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

const WorkspaceList = () => {
    const [workspaces = [], loading, error, refresh] = useAsync(WorkspaceAPI.getWorkspaces);

    // refresh every 30 seconds
    useRepeat(refresh, 30000);

    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(workspaces, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);
    const {currentUser: {authorizations}} = useContext(UserContext);
    const gotoWorkspace = (workspace) => {
        if (authorizations.includes(`user-${workspace.name}`)) {
            window.location.href = workspace.url
        }
    };

    if (loading) {
        return <LoadingInlay/>;
    }

    if (error) {
        return <MessageDisplay message="An error occurred while loading workspaces"/>;
    }

    return (
        <Paper>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell/>
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
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pagedItems.map((workspace) => {
                        return (
                            <TableRow
                                hover
                                key={workspace.name}
                            >
                                <TableCell align="left">
                                    <FolderOpen/>
                                </TableCell>
                                <TableCell onClick={() => gotoWorkspace(workspace) }>
                                    {workspace.name}
                                </TableCell>
                                <TableCell>
                                    {workspace.version}
                                </TableCell>
                                <TableCell>
                                    {workspace.status}
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

export default WorkspaceList;
