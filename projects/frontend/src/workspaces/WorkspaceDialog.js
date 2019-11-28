import React, {useRef} from "react";

import {
    Dialog, DialogTitle, Typography,
    DialogActions, Button, DialogContent,
    Stepper, Step, StepLabel, StepContent, TableRow, TableCell, Table, TableBody
} from "@material-ui/core";
import ControlledTextField from "../common/components/ControlledTextField";

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
        inputProps={{
            'aria-label': label,
            ...inputProps
        }}
    />
);

export default ({onSubmit, onClose, title, fieldsGroups, submitDisabled, submitText}) => {
    const totalSteps = fieldsGroups.length + 1; // filedGroups + confirmation
    const [activeStep, setActiveStep] = React.useState(1);

    const allStepsSeen = useRef(false);
    allStepsSeen.current = allStepsSeen.current || activeStep === totalSteps;

    const handleNext = () => {
        // Consider clicking next as all fields on the current steps are touched
        fieldsGroups.forEach(({fields}) => {
            fields.forEach(({control}, index) => {
                if (activeStep >= index) {
                    control.declareTouched();
                }
            });
        });
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const fieldsHaveError = (fields) => fields.some(({control}) => control.touched && !control.valid);

    const backButton = () => (
        <Button
            disabled={activeStep === 1}
            onClick={handleBack}
            style={{marginRight: 4}}
        >
            Back
        </Button>
    );

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
                    data-testid="form"
                    id="formId"
                    noValidate
                    onSubmit={onSubmit}
                >
                    <Stepper activeStep={activeStep - 1} orientation="vertical">
                        {
                            fieldsGroups
                                .map(({fields, label, helperText}) => (
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
                                                {backButton()}
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleNext}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </StepContent>
                                    </Step>
                                ))
                        }
                        <Step key="lastStep">
                            <StepLabel>Confirmation</StepLabel>
                            <StepContent>
                                <Table size="small">
                                    <TableBody>
                                        {
                                            fieldsGroups.map(({fields}) => fields.map(({id, label, control}) => {
                                                const cellErrorStyle = control.touched && !control.valid ? {color: 'red'} : {};
                                                return (
                                                    <TableRow key={id}>
                                                        <TableCell
                                                            style={cellErrorStyle}
                                                            variant="head"
                                                        >{label}
                                                        </TableCell>
                                                        <TableCell
                                                            style={cellErrorStyle}
                                                        >
                                                            {control.value}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }))
                                        }
                                    </TableBody>
                                </Table>
                                <div style={{marginTop: 10}}>
                                    {backButton()}
                                    <Button
                                        data-testid="submit-button"
                                        type="submit"
                                        form="formId"
                                        disabled={submitDisabled || !allStepsSeen.current}
                                        color="primary"
                                        variant="contained"
                                    >
                                        {submitText}
                                    </Button>
                                </div>
                            </StepContent>
                        </Step>
                    </Stepper>
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
            </DialogActions>
        </Dialog>
    );
};
