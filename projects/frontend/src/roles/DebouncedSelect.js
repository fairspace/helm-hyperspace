import React from 'react';
import {PropTypes} from 'prop-types';
import MaterialReactSelect from "../common/components/MaterialReactSelect";

const SEARCH_DROPDOWN_DEFAULT_SIZE = 10;

/**
 * Generic select with autocomplete with a configurable debounce time
 * @param fetchItems {DebouncedSelect~fetchItems} Function to retrieve a list of items based on the query
 * @param debounce {number} Number of milliseconds that the select waits before executing a request. This will help
 *                          avoiding too many backend calls
 * @param otherProps {object} Other properties passed onto the {MaterialReactSelect} component
 * @returns {*}
 * @constructor
 */
/**
 * This callback describes the fetchItems property
 * @callback DebouncedSelect~fetchItems
 * @param {number} size Max number of results to return
 * @param {string} query Query to filter the list on
 * @return {Promise<array>} List of items. Each item should have at least a label that is being shown in the select
 */
export const DebouncedSelect = ({
    fetchItems = () => Promise.resolve([]),
    debounce = 300,
    ...otherProps
}) => {
    let fetchRequest = null;

    const search = query => fetchItems({size: SEARCH_DROPDOWN_DEFAULT_SIZE, query});

    const debouncedSearch = (query) => {
        if (fetchRequest) {
            clearTimeout(fetchRequest);
        }

        return new Promise((resolve, reject) => {
            if (fetchRequest) {
                clearTimeout(fetchRequest);
            }

            fetchRequest = setTimeout(() => {
                search(query)
                    .then(resolve)
                    .catch(reject);
            }, debounce);
        });
    };

    return (
        <MaterialReactSelect
            {...otherProps}
            style={{width: '100%'}}
            async
            loadOptions={debouncedSearch}
        />
    );
};

DebouncedSelect.propTypes = {
    fetchItems: PropTypes.func,
    debounce: PropTypes.number
};

export default DebouncedSelect;
