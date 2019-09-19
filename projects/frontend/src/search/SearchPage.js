import React, {useCallback} from 'react';
import PropTypes from "prop-types";
import {
    Paper, Table, TableBody,
    TableCell, TableHead, TableRow
} from '@material-ui/core';
import {
    LoadingInlay, MessageDisplay, SearchResultHighlights,
    getSearchQueryFromString, SearchAPI, SORT_DATE_CREATED, useAsync
} from '@fairspace/shared-frontend';

import Config from "../common/services/Config";

// Exporting here to be able to test the component outside of Redux
export const SearchPage = ({
    location: {search}, query = getSearchQueryFromString(search)
}) => {
    const {error, loading, data} = useAsync(
        useCallback(() => SearchAPI(Config.get(), "hyperspace")
            .search({query, sort: SORT_DATE_CREATED}), [query])
    );

    /**
     * Handles a click on a search result.
     * @param result   The clicked search result. For the format, see the ES api
     */
    const handleResultDoubleClick = (result) => {
        // const navigationPath = getCollectionAbsolutePath(getPathOfResult(result));

        // history.push(navigationPath);
        // deselectAllPaths();
        // selectPath('/' + result.filePath);
    };

    if (loading) {
        return <LoadingInlay />;
    }

    if (!loading && error && error.message) {
        return <MessageDisplay message={error.message} />;
    }

    if (!data || data.total === 0) {
        return <MessageDisplay message="No results found!" isError={false} />;
    }

    return (
        <Paper style={{width: '100%'}} data-testid="results-table">
            <Table padding="dense">
                <TableHead>
                    <TableRow>
                        <TableCell>Label</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Match</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.items
                        .map(({id, label, name, type, comment, highlights}) => (
                            <TableRow
                                hover
                                key={id}
                                onDoubleClick={() => handleResultDoubleClick(id)}
                            >
                                <TableCell>
                                    {label || name}
                                </TableCell>
                                <TableCell>
                                    {type}
                                </TableCell>
                                <TableCell>
                                    {comment}
                                </TableCell>
                                <TableCell>
                                    <SearchResultHighlights highlights={highlights} />
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

SearchPage.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    })
};

export default SearchPage;
