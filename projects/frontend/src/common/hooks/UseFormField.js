import {useState} from "react";

export const useFormField = (initialValue) => {
    const [value, setValue] = useState(initialValue);
    const [touched, setTouched] = useState(false);

    const declareToched = () => {
        setTouched(true);
    };

    return [
        value,
        setValue,
        touched,
        declareToched,
    ];
};
