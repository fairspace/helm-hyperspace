import React from "react";

import {useFormField} from "../common/hooks/UseFormField";
import WorkspaceDialog from "./WorkspaceDialog";

const DEFAULT_LOG_AND_FILES_SIZE = 100;
const DEFAULT_DATABASE_VOLUME_SIZE = 50;
const ID_PATTERN = /^[a-z]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export default ({onSubmit, onClose, isUpdate, workspace: {id = '', name = '', description = '', logAndFilesVolumeSize = DEFAULT_LOG_AND_FILES_SIZE, databaseVolumeSize = DEFAULT_DATABASE_VOLUME_SIZE} = {}}) => {
    const minLogAndFilesVolumeSize = isUpdate ? logAndFilesVolumeSize : 1;
    const minDatabaseVolumeSize = isUpdate ? databaseVolumeSize : 1;

    const idControl = useFormField(id, value => !!value && ID_PATTERN.test(value));
    const nameControl = useFormField(name, value => !!value);
    const descriptionControl = useFormField(description, () => true);
    const logAndFilesVolumeSizeControl = useFormField(logAndFilesVolumeSize, value => value >= minLogAndFilesVolumeSize);
    const databaseVolumeSizeControl = useFormField(databaseVolumeSize, value => value >= minDatabaseVolumeSize);
    const allControls = [idControl, nameControl, descriptionControl, logAndFilesVolumeSizeControl, databaseVolumeSizeControl];

    const formValid = allControls.every(({valid}) => valid);
    const modified = allControls.some(({touched}) => touched);

    const details = {
        label: "Details",
        helperText: "",
        fields: [
            {
                control: idControl,
                required: true,
                autoFocus: true,
                id: "id",
                label: "Id",
                name: "id",
                disabled: isUpdate,
                helperText: "Only lower case letters, numbers, hyphens and should start with a letter."
            },
            {
                control: nameControl,
                required: true,
                id: "name",
                label: "Name",
                name: "name",
            },
            {
                control: descriptionControl,
                id: "description",
                label: "Description",
                name: "description",
                multiline: true
            }
        ]
    };
    const configuration = {
        label: "Configuration",
        helperText: "Please note that once the workspace is created the volumes can be increased but never decreased.",
        fields: [
            {
                control: logAndFilesVolumeSizeControl,
                id: "logAndFilesVolumeSize",
                label: "Log and files volume size in gigabytes",
                name: "logAndFilesVolumeSize",
                type: "number",
                inputProps: {min: minLogAndFilesVolumeSize},
                required: true
            },
            {
                control: databaseVolumeSizeControl,
                id: "databaseVolumeSize",
                label: "Database volume size in gigabytes",
                name: "databaseVolumeSize",
                type: "number",
                inputProps: {min: minDatabaseVolumeSize},
                required: true
            }
        ]
    };

    const validateAndSubmit = () => formValid && onSubmit(
        {
            id: idControl.value,
            name: nameControl.value,
            description: descriptionControl.value,
            logAndFilesVolumeSize: logAndFilesVolumeSizeControl.value,
            databaseVolumeSize: databaseVolumeSizeControl.value
        }
    );

    return (
        <WorkspaceDialog
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                validateAndSubmit();
            }}
            onClose={onClose}
            title={isUpdate ? `Update workspace ${id}` : "New Workspace"}
            details={details}
            configuration={configuration}
            submitDisabled={Boolean(!formValid || (isUpdate && !modified))}
            submitText={isUpdate ? "Update Workspace" : "Create Workspace"}
        />
    );
};
