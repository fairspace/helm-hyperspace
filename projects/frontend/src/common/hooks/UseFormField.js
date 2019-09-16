import {useState} from "react";

export const useFormField = (initialValue) => {
    const [value, setValue] = useState(initialValue);
    const [touched, setTouched] = useState(false);

    const declareTouched = () => {
        setTouched(true);
    };

    return {
        value,
        setValue,
        touched,
        declareTouched,
    };
};
