import React from "react";

import {
    Dialog, DialogTitle, Typography,
    DialogActions, Button, DialogContent, TextField,
} from "@material-ui/core";
import {useFormField} from "../common/hooks/UseFormField";

const DEFAULT_LOG_AND_FILES_SIZE = 100;
const DEFAULT_DATABASE_VOLUME_SIZE = 50;
const ID_PATTERN = /^[a-z]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export default ({onCreate, onClose}) => {
    const [id, setId, idTouched, setIdTouched] = useFormField('');
    const [name, setName, nameTouched, setNameTouched] = useFormField('');
    const [description, setDescription] = useFormField('');
    const [logAndFilesVolumeSize, setLogAndFilesVolumeSize, logAndFilesVolumeSizeTouched, setLogAndFilesVolumeSizeTouched] = useFormField(DEFAULT_LOG_AND_FILES_SIZE);
    const [databaseVolumeSize, setDatabaseVolumeSize, databaseVolumeSizeTouched, setDatabaseVolumeSizeTouched] = useFormField(DEFAULT_DATABASE_VOLUME_SIZE);

    const idValid = !!id && ID_PATTERN.test(id);
    const nameValid = !!name;
    const logAndFilesVolumeSizeValid = logAndFilesVolumeSize >= 1;
    const databaseVolumeSizeValid = databaseVolumeSize >= 1;

    const formValid = idValid && nameValid && logAndFilesVolumeSizeValid && databaseVolumeSizeValid;

    const createWorkspace = () => onCreate({id, name, description, logAndFilesVolumeSize, databaseVolumeSize});

    return (
        <Dialog
            open
            onClose={onClose}
            aria-labelledby="form-dialog-title"
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle disableTypography id="form-dialog-title">
                <Typography variant="h5">New Workspace</Typography>
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
                    <TextField
                        autoFocus
                        margin="dense"
                        id="id"
                        label="Id"
                        value={id}
                        error={idTouched && !idValid}
                        name="id"
                        onChange={(event) => setId(event.target.value)}
                        onBlur={setIdTouched}
                        fullWidth
                        required
                        helperText="Only lower case letters, numbers, hyphens and should start with a letter."
                    />
                    <TextField
                        margin="dense"
                        id="name"
                        label="Name"
                        value={name}
                        error={nameTouched && !nameValid}
                        name="name"
                        onChange={(event) => setName(event.target.value)}
                        onBlur={setNameTouched}
                        fullWidth
                        required
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        label="Description"
                        value={description}
                        name="description"
                        onChange={(event) => setDescription(event.target.value)}
                        multiline
                        fullWidth
                    />
                    <TextField
                        margin="dense"
                        id="logAndFilesVolumeSize"
                        label="Log and files volume size in gigabytes"
                        value={logAndFilesVolumeSize}
                        error={logAndFilesVolumeSizeTouched && !logAndFilesVolumeSizeValid}
                        onBlur={setLogAndFilesVolumeSizeTouched}
                        name="logAndFilesVolumeSize"
                        type="number"
                        inputProps={{min: 1}}
                        onChange={(event) => setLogAndFilesVolumeSize(event.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        margin="dense"
                        id="databaseVolumeSize"
                        label="Database volume size in gigabytes"
                        value={databaseVolumeSize}
                        error={databaseVolumeSizeTouched && !databaseVolumeSizeValid}
                        name="databaseVolumeSize"
                        type="number"
                        inputProps={{min: 1}}
                        onChange={(event) => setDatabaseVolumeSize(event.target.value)}
                        onBlur={setDatabaseVolumeSizeTouched}
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
                    disabled={!formValid}
                    color="primary"
                    variant="contained"
                >
                    Create Workspace
                </Button>
            </DialogActions>
        </Dialog>
    );
};
