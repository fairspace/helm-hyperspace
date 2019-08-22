import {useEffect, useRef} from "react";

/**
 * Perform a promise-returning action periodically with a fixed delay between executions.
 * Waits for each promise to finish before scheduling a new one.
 * @param callback
 * @param delay
 */
export default (callback, delay) => {
    const savedCallback = useRef();
    const id = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick () {
            savedCallback.current()
                .finally(() => {
                    id.current = setTimeout(tick, delay);
                });
        }

        id.current = setTimeout(tick, delay);
        return () => clearTimeout(id.current);
    }, [delay]);
};
