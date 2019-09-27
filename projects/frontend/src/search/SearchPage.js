import React, {useCallback} from 'react';
import PropTypes from "prop-types";
import {Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';
import {
    LoadingInlay, MessageDisplay, SearchResultHighlights,
    getSearchQueryFromString, SearchAPI, SORT_DATE_CREATED, useAsync
} from '@fairspace/shared-frontend';

import Config from "../common/services/Config";

export const SearchPage = ({loading, error, results}) => {
    const handleResultDoubleClick = (url) => {
        window.open(url, '_blank');
    };

    if (loading) {
        return <LoadingInlay />;
    }

    if (!loading && error && error.message) {
        return <MessageDisplay message={error.message} />;
    }

    if (!results || results.total === 0) {
        return <MessageDisplay message="No results found!" isError={false} />;
    }

    return (
        <Paper style={{width: '100%'}} data-testid="results-table">
            <Table padding="dense">
                <TableHead>
                    <TableRow>
                        <TableCell>Entity</TableCell>
                        <TableCell>Workspace</TableCell>
                        <TableCell>Match</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.items
                        .map(({id, iri, label, name, type, comment, description, index, highlights}) => (
                            <TableRow
                                hover
                                key={id}
                                onDoubleClick={() => handleResultDoubleClick(iri || id)}
                            >
                                <TableCell>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {label || name}
                                    </Typography>
                                    <Typography variant="caption" gutterBottom>
                                        {type}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {comment || description}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {index}
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

const SearchPageContainer = ({
    location: {search},
    query = getSearchQueryFromString(search),
    searchApi = SearchAPI(Config.get(), Config.get().searchIndex)
}) => {
    const {error, loading, data} = useAsync(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        useCallback(() => searchApi
            .search({query, sort: SORT_DATE_CREATED})
            .catch((e) => {
                switch (e.status) {
                    case 403: throw new Error("No workspaces available to search in");
                    default: return handleSearchError(e);
                }
            }),
        [query])
    );

    return <SearchPage error={error} loading={loading} results={data} />;
};

SearchPageContainer.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }),
    query: PropTypes.string,
    searchApi: PropTypes.shape({
        search: PropTypes.func.isRequired
    })
};

export default SearchPageContainer;
