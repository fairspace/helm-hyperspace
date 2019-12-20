import {useContext} from "react";
import {generateUniqueFileName} from "../common/utils/fileUtils";
import UploadsContext, {UPLOAD_STATUS_INITIAL} from "../common/contexts/UploadsContext";

/**
 * This hook contains logic about uploads for a certain directory.
 */
export const disconnectedUseUploads = (path, existingFilenames, allUploads, enqueueUploads, startUpload) => {
    const uploads = allUploads.filter(upload => upload.destinationPath === path);

    // Create a list of used filenames, including the current uploads
    const usedFilenames = existingFilenames.concat(uploads.map(upload => upload.destinationFilename));

    const enqueue = files => enqueueUploads(
        files.map(file => ({
            file,
            destinationFilename: generateUniqueFileName(file.name, usedFilenames),
            destinationPath: path
        }))
    );

    const startAll = () => uploads
        .filter(upload => upload.status === UPLOAD_STATUS_INITIAL)
        .map(upload => startUpload(upload));

    return {
        enqueue,
        startAll,
        uploads
    };
};

const useUploads = (path, existingFilenames = []) => {
    const {getUploads, enqueueUploads, startUpload} = useContext(UploadsContext);

    return disconnectedUseUploads(path, existingFilenames, getUploads(), enqueueUploads, startUpload);
};

export default useUploads;
