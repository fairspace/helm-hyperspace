import {useEffect, useState} from "react";

/**
 * Custom hook to perform pagination
 * @param items     Sorted items
 * @param initialRowsPerPage
 * @returns {{pagedItems: *, page: number, setRowsPerPage: function, rowsPerPage: number, setPage: function<Number>>}}
 */
const useAsync = (callback) => {
    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState();

    useEffect(() => {
        setLoading(true);
        callback()
            .then(setData)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [callback]);

    return [data, loading, error];
};

export default useAsync;
