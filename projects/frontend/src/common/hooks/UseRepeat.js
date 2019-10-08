import {useEffect} from "react";

/**
 * Performs a promise-returning action periodically with a fixed delay between executions.
 * Waits for each promise to finish before scheduling a new one.
 * @param callback
 * @param delay
 */
export default (callback, delay) => {
    // Set up the interval.
    useEffect(() => {
        let id = setTimeout(function tick() {
            callback().finally(() => {
                id = setTimeout(tick, delay);
            });
        }, delay);
        return () => clearTimeout(id);
    }, [callback, delay]);
};
