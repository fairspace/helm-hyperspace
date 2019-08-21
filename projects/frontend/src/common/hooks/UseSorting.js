import {useState} from "react";

import {compareBy} from "../utils/genericUtils";

/**
 * Sorting algorithm that will use the original order if
 * the fields are the same, and as such always return a stable order
 * @param array
 * @param cmp
 * @param ascending
 * @returns {*}
 */
const stableSort = (array, cmp, ascending = true) => {
    if (!Array.isArray(array)) {
        return array;
    }

    const arrayWithIndices = array.map((el, index) => [el, index]);
    arrayWithIndices.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return ascending ? a[1] - b[1] : b[1] - a[1];
    });
    return arrayWithIndices.map(el => el[0]);
};

/**
 * Custom hook to perform sorting
 * @param items     List of items to be sorted
 * @param columns   Key-value pairs defining the columns. The key is an identifier, the value is
 *                  an object containing the following keys:
 *                      valueExtractor: either a function for extracting the value to sort on from an item,
 *                                      or a property name for extracting the value from the item.
 *                                      It is passed to the {compareBy} function
 * @param initialOrderBy    Initial column to order on
 * @returns {{toggleSort: toggleSort, orderAscending: boolean, orderBy: any, orderedItems: *}}
 * @see {compareBy}
 */
const useSorting = (items, columns, initialOrderBy) => {
    const [orderAscending, setOrderAscending] = useState(true);
    const [orderBy, setOrderBy] = useState(initialOrderBy);

    const orderedItems = stableSort(items, compareBy(columns[orderBy].valueExtractor, orderAscending), orderAscending);
    const toggleSort = column => {
        if (orderBy === column) {
            setOrderAscending(!orderAscending);
        } else {
            setOrderAscending(true);
            setOrderBy(column);
        }
    };

    return {
        orderAscending,
        orderBy,
        toggleSort,

        orderedItems
    };
};

export default useSorting;
