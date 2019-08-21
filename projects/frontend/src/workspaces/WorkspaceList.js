import React from 'react';
import {
    Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel
} from "@material-ui/core";
import FolderOpen from "@material-ui/icons/FolderOpen";

import useSorting from "../common/hooks/UseSorting";
import usePagination from "../common/hooks/UsePagination";
import MessageDisplay from "../common/components/MessageDisplay";
import WorkspaceAPI from "./WorkspaceAPI";
import LoadingInlay from "../common/components/LoadingInlay";
import useAsync from "../common/hooks/UseAsync";

const columns = {
    name: {
        valueExtractor: 'name',
        label: 'Name'
    },
    version: {
        valueExtractor: 'version',
        label: 'Version'
    }
};

const WorkspaceList = () => {
    const [workspaces = [], loading, error] = useAsync(WorkspaceAPI.getWorkspaces);
    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(workspaces, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

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
                        <TableCell />
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
                                    <FolderOpen />
                                </TableCell>
                                <TableCell>
                                    {workspace.name}
                                </TableCell>
                                <TableCell>
                                    {workspace.version}
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
