import React, {useCallback} from 'react';
import PropTypes from "prop-types";
import {Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';
import {
    LoadingInlay, MessageDisplay, SearchResultHighlights,
    getSearchQueryFromString, SearchAPI, SORT_DATE_CREATED, useAsync
} from '@fairspace/shared-frontend';

import Config from "../common/services/Config";
import {ES_INDEX} from '../constants';

const SearchPage = ({location: {search}, query = getSearchQueryFromString(search)}) => {
    const {error, loading, data} = useAsync(
        useCallback(() => SearchAPI(Config.get(), ES_INDEX)
            .search({query, sort: SORT_DATE_CREATED}), [query])
    );

    const handleResultDoubleClick = (url) => {
        window.open(url, '_blank');
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
                        <TableCell>Entity</TableCell>
                        <TableCell>Workspace</TableCell>
                        <TableCell>Match</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.items
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

SearchPage.propTypes = {
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }),
    query: PropTypes.string
};

export default SearchPage;
