import {useEffect, useRef} from "react";

/**
 * Perform an action periodically, the React hooks way
 * @param callback
 * @param delay
 */
export default (callback, delay) => {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        const tick = () => savedCallback.current();

        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};
