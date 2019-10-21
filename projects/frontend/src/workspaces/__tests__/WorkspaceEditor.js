import React from 'react';
import {render, fireEvent, cleanup} from '@testing-library/react';

import WorkspaceEditor from "../WorkspaceEditor";

const ID_LABEL = "Id";
const NAME_LABEL = "Name";
const DESCRIPTION_LABEL = "Description";
const LOG_AND_FILES_VOLUME_SIZE_LABEL = "Log and files volume size in gigabytes";
const DATABASE_VOLUME_SIZE_LABEL = "Database volume size in gigabytes";

describe('WorkspaceEditor', () => {
    let onSubmit;
    let utils;

    const enterValue = (label, value) => fireEvent.change(utils.getByLabelText(label), {target: {value}});

    const submit = () => fireEvent.submit(utils.getByTestId('form'));

    // Click next to render next fields (not sure why 'finish' is returning multiple elements, possibly a bug?)
    const next = (finish) => fireEvent.click(finish ? utils.getAllByText(/finish/i)[0] : utils.getByText(/next/i));

    beforeEach(() => {
        onSubmit = jest.fn();
        utils = render(<WorkspaceEditor onSubmit={onSubmit} />);
    });

    afterEach(cleanup);

    it('should send all entered parameters to the creation method', () => {
        enterValue(ID_LABEL, 'a');
        enterValue(NAME_LABEL, 'b');
        enterValue(DESCRIPTION_LABEL, 'c');
        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '4');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit)
            .toHaveBeenCalledWith({
                id: 'a',
                name: 'b',
                description: 'c',
                logAndFilesVolumeSize: '4',
                databaseVolumeSize: '5'
            });
    });

    it('should enables and disables submit button at proper times', () => {
        enterValue(ID_LABEL, 'a');
        enterValue(NAME_LABEL, 'b');

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled');

        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '4');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '5');

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled');

        next(true);
        submit();

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled', false);
    });

    it('should require an identifier', () => {
        enterValue(NAME_LABEL, 'b');
        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '4');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require a name', () => {
        enterValue(ID_LABEL, 'a');
        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '4');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require PV sizes larger than 0', () => {
        enterValue(ID_LABEL, 'a');
        enterValue(NAME_LABEL, 'b');
        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '0');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require PV sizes larger than 0 (databaseVolumeSize is 0)', () => {
        enterValue(ID_LABEL, 'a');
        enterValue(NAME_LABEL, 'b');
        next();
        enterValue(LOG_AND_FILES_VOLUME_SIZE_LABEL, '1');
        enterValue(DATABASE_VOLUME_SIZE_LABEL, '0');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });
});
