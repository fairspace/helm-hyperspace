import {useEffect, useRef} from "react";

/**
 * Perform an action periodically, the React hooks way
 * @param callback
 * @param delay
 */
export default (callback, delay) => {
    useEffect(callback, []);

    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};
