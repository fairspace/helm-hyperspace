import React from "react";
import PropTypes from 'prop-types';
import {TextField} from "@material-ui/core";

/**
 * This component is an input field that is aware of it's touched (blur) state and will only error if it's touched
 */
const ControlledTextField = ({control: {value, touched, setValue, valid, declareTouched}, ...props}) => (
    <TextField
        {...props}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={declareTouched}
        error={touched && !valid}
    />
);

ControlledTextField.propTypes = {
    control: PropTypes.exact({
        value: PropTypes.any.isRequired,
        setValue: PropTypes.func.isRequired,
        valid: PropTypes.bool.isRequired,
        touched: PropTypes.bool.isRequired,
        declareTouched: PropTypes.func.isRequired,
    }),
};

export default ControlledTextField;
