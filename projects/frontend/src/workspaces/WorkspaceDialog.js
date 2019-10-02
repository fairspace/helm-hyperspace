import React from "react";

import {
    Dialog, DialogTitle, Typography,
    DialogActions, Button, DialogContent, TextField,
} from "@material-ui/core";
import {useFormField} from "../common/hooks/UseFormField";
import ControlledField from "../common/components/ControlledField";

const DEFAULT_LOG_AND_FILES_SIZE = 100;
const DEFAULT_DATABASE_VOLUME_SIZE = 50;
const ID_PATTERN = /^[a-z]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export default ({onSubmit, onClose, workspace: {id = '', name = '', description = '', logAndFilesVolumeSize = DEFAULT_LOG_AND_FILES_SIZE, databaseVolumeSize = DEFAULT_DATABASE_VOLUME_SIZE} = {}}) => {
    const isUpdate = !!id;
    const idControl = useFormField(id);
    const nameControl = useFormField(name);
    const descriptionControl = useFormField(description);
    const logAndFilesVolumeSizeControl = useFormField(logAndFilesVolumeSize);
    const databaseVolumeSizeControl = useFormField(databaseVolumeSize);

    const idValid = !!idControl.value && ID_PATTERN.test(idControl.value);
    const nameValid = !!nameControl.value;
    const logAndFilesVolumeSizeValid = logAndFilesVolumeSizeControl.value >= 1;
    const databaseVolumeSizeValid = databaseVolumeSizeControl.value >= 1;

    const formValid = idValid && nameValid && logAndFilesVolumeSizeValid && databaseVolumeSizeValid;

    const createWorkspace = () => formValid && onSubmit(
        {
            id: idControl.value,
            name: nameControl.value,
            description: descriptionControl.value,
            logAndFilesVolumeSize: logAndFilesVolumeSizeControl.value,
            databaseVolumeSize: databaseVolumeSizeControl.value
        },
        isUpdate
    );

    const modified = [nameControl, descriptionControl, logAndFilesVolumeSizeControl, databaseVolumeSizeControl].some(ctrl => ctrl.touched);

    return (
        <Dialog
            open
            onClose={onClose}
            aria-labelledby="form-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle disableTypography id="form-dialog-title">
                <Typography variant="h5">{isUpdate ? `Update workspace ${id}`: "New Workspace"}</Typography>
            </DialogTitle>
            <DialogContent style={{overflowX: 'hidden'}}>
                <form
                    id="formId"
                    noValidate
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        createWorkspace();
                    }}
                >
                    <ControlledField
                        component={TextField}
                        control={idControl}
                        valid={idValid}
                        autoFocus
                        margin="dense"
                        id="id"
                        label="Id"
                        name="id"
                        fullWidth
                        required
                        disabled={isUpdate}
                        helperText="Only lower case letters, numbers, hyphens and should start with a letter."
                    />
                    <ControlledField
                        component={TextField}
                        control={nameControl}
                        valid={nameValid}
                        margin="dense"
                        id="name"
                        label="Name"
                        name="name"
                        fullWidth
                        required
                    />
                    <ControlledField
                        component={TextField}
                        control={descriptionControl}
                        valid
                        margin="dense"
                        id="description"
                        label="Description"
                        name="description"
                        multiline
                        fullWidth
                    />
                    <ControlledField
                        component={TextField}
                        control={logAndFilesVolumeSizeControl}
                        valid={logAndFilesVolumeSizeValid}
                        margin="dense"
                        id="logAndFilesVolumeSize"
                        label="Log and files volume size in gigabytes"
                        name="logAndFilesVolumeSize"
                        type="number"
                        inputProps={{min: 1}}
                        fullWidth
                        required
                    />
                    <ControlledField
                        component={TextField}
                        control={databaseVolumeSizeControl}
                        valid={databaseVolumeSizeValid}
                        margin="dense"
                        id="databaseVolumeSize"
                        label="Database volume size in gigabytes"
                        name="databaseVolumeSize"
                        type="number"
                        inputProps={{min: 1}}
                        fullWidth
                        required
                    />
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
                    type="submit"
                    form="formId"
                    disabled={!formValid || (isUpdate && !modified)}
                    color="primary"
                    variant="contained"
                >
                    {isUpdate ? "Update Workspace" : "Create Workspace"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
