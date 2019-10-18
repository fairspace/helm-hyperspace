import React, {useEffect} from "react";

import {
    Dialog, DialogTitle, Typography,
    DialogActions, Button, DialogContent,
    Stepper, Step, StepLabel, StepContent
} from "@material-ui/core";
import ControlledTextField from "../common/components/ControlledTextField";

const TOTAL_STEPS = 2;

const ControlledTextFieldWrapper = ({
    control, type, autoFocus = false, required = false,
    id, label, name, disabled, multiline = false, helperText, inputProps
}) => (
        <ControlledTextField
            key={id}
            fullWidth
            margin="dense"
            autoFocus={autoFocus}
            control={control}
            type={type}
            disabled={disabled}
            id={id}
            label={label}
            name={name}
            multiline={multiline}
            required={required}
            helperText={helperText}
            inputProps={inputProps}
        />
    );

export default ({onSubmit, onClose, title, details, configuration, submitDisabled, submitText}) => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [allStepsSeen, setAllStepsSeen] = React.useState(false);

    const allSteps = [details, configuration];

    useEffect(() => {
        if (activeStep === TOTAL_STEPS) {
            setAllStepsSeen(true);
        }
    }, [activeStep]);

    const handleNext = () => {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    // const fieldsHaveError = (fields) => fields.some(({control}) => !control.valid);
    const fieldsHaveError = (fields) => fields.some(({control}) => control.touched && !control.valid);

    return (
        <Dialog
            open
            onClose={onClose}
            aria-labelledby="form-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle disableTypography id="form-dialog-title">
                <Typography variant="h5">{title}</Typography>
            </DialogTitle>
            <DialogContent style={{overflowX: 'hidden'}}>
                <form
                    id="formId"
                    noValidate
                    onSubmit={onSubmit}
                >
                    <Stepper activeStep={activeStep} orientation="vertical">
                        {
                            allSteps.map(({fields, label, helperText}) => (
                                <Step key={label}>
                                    <StepLabel error={fieldsHaveError(fields)}>{label}</StepLabel>
                                    <StepContent>
                                        {helperText && (
                                            <Typography color="textPrimary" variant="subtitle2" gutterBottom>
                                                {helperText}
                                            </Typography>
                                        )}
                                        {fields.map(ControlledTextFieldWrapper)}
                                        <div style={{marginTop: 10}}>
                                            <Button
                                                disabled={activeStep === 0}
                                                onClick={handleBack}
                                                style={{marginRight: 4}}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleNext}
                                            >
                                                {activeStep === TOTAL_STEPS ? 'Finish' : 'Next'}
                                            </Button>
                                        </div>
                                    </StepContent>
                                </Step>
                            ))
                        }
                    </Stepper>
                    {activeStep === TOTAL_STEPS && (
                        <Button onClick={() => setActiveStep(0)}>
                            Go to details
                        </Button>
                    )}
                </form>
            </DialogContent>
            <DialogActions>
                <Button
                    type="button"
                    onClick={onClose}
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    data-testid="submit-button"
                    type="submit"
                    form="formId"
                    disabled={submitDisabled || !allStepsSeen}
                    color="primary"
                    variant="contained"
                >
                    {submitText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
