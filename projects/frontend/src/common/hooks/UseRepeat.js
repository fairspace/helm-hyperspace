import {useEffect, useRef} from "react";

/**
 * Performs a promise-returning action periodically with a fixed delay between executions.
 * Waits for each promise to finish before scheduling a new one.
 * @param callback
 * @param delay
 */
export default (callback, delay) => {
    const id = useRef();

    // Set up the interval.
    useEffect(() => {
        function tick() {
            callback()
                .finally(() => {
                    id.current = setTimeout(tick, delay);
                });
        }

        id.current = setTimeout(tick, delay);
        return () => clearTimeout(id.current);
    }, [callback, delay]);
};
