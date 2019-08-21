import React, {useState} from 'react';
import {
    Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel
} from "@material-ui/core";
import FolderOpen from "@material-ui/icons/FolderOpen";

import useSorting from "../common/hooks/UseSorting";
import usePagination from "../common/hooks/UsePagination";
import MessageDisplay from "../common/components/MessageDisplay";
import WorkspaceAPI from "./WorkspaceAPI";
import LoadingInlay from "../common/components/LoadingInlay";
import {useInterval} from "../common/utils/genericUtils";

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
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, serError] = useState(null);

    const refreshWorkspaces = () => WorkspaceAPI.getWorkspaces()
        .then((workspaces) => {
            setLoading(false);
            serError(null);
            setWorkspaces(workspaces);
        })
        .catch((error) => {
            setLoading(false);
            serError(error);
            setWorkspaces([]);
        });

    // refresh every 5 seconds
    useInterval(refreshWorkspaces, 5000);

    const {orderedItems, orderAscending, orderBy, toggleSort} = useSorting(workspaces, columns, 'name');
    const {page, setPage, rowsPerPage, setRowsPerPage, pagedItems} = usePagination(orderedItems);

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
                                <TableCell>
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
