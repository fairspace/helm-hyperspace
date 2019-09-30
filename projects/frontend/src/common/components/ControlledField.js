import React from "react";
import PropTypes from 'prop-types';

/**
 * This component is an input field that is aware of it's touched (blur) state and will only error if it's touched
 */
const ControlledField = ({component: Component, control, valid, ...props}) => (
    <Component
        {...props}
        value={control.value}
        onChange={e => control.setValue(e.target.value)}
        onBlur={control.declareTouched}
        error={!valid && control.touched}
    />
);

ControlledField.propTypes = {
    component: PropTypes.elementType.isRequired,
    control: PropTypes.exact({
        value: PropTypes.any.isRequired,
        setValue: PropTypes.func.isRequired,
        touched: PropTypes.bool.isRequired,
        declareTouched: PropTypes.func.isRequired,
    }),
    valid: PropTypes.bool.isRequired,
};

export default ControlledField;
