import React from 'react';
import {render, fireEvent, cleanup} from '@testing-library/react';

import WorkspaceEditor from "../WorkspaceEditor";

describe('WorkspaceEditor', () => {
    let onSubmit;
    let utils;

    const enterValue = (label, value) => fireEvent.change(utils.getByLabelText(label), {target: {value}});
    const enterId = (value) => enterValue('Id', value);
    const enterName = (value) => enterValue('Name', value);
    const enterDescription = (value) => enterValue('Description', value);
    const enterLogAndFilesSize = (value) => enterValue('Log and files volume size in gigabytes', value);
    const enterDatabaseSize = (value) => enterValue('Database volume size in gigabytes', value);

    const submit = () => fireEvent.submit(utils.getByTestId('form'));

    // Click next to render next fields (not sure why 'finish' is returning multiple elements, possibly a bug?)
    const next = (finish) => fireEvent.click(finish ? utils.getAllByText(/create/i)[0] : utils.getByText(/next/i));

    beforeEach(() => {
        onSubmit = jest.fn();
        utils = render(<WorkspaceEditor onSubmit={onSubmit} />);
    });

    afterEach(cleanup);

    it('should send all entered parameters to the creation method', () => {
        enterId('a');
        enterName('b');
        enterDescription('c');
        next();
        enterLogAndFilesSize('4');
        enterDatabaseSize('5');
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
        enterId('a');
        enterName('b');

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled');

        next();
        enterLogAndFilesSize('4');
        enterDatabaseSize('5');

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled');

        next(true);
        submit();

        expect(utils.getByTestId('submit-button')).toHaveProperty('disabled', false);
    });

    it('should require an identifier', () => {
        enterName('b');
        next();
        enterLogAndFilesSize('4');
        enterDatabaseSize('5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require a name', () => {
        enterId('a');
        next();
        enterLogAndFilesSize('4');
        enterDatabaseSize('5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require PV sizes larger than 0', () => {
        enterId('a');
        enterName('b');
        next();
        enterLogAndFilesSize('0');
        enterDatabaseSize('5');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('should require PV sizes larger than 0 (databaseVolumeSize is 0)', () => {
        enterId('a');
        enterName('b');
        next();
        enterLogAndFilesSize('1');
        enterDatabaseSize('0');
        next(true);
        submit();

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });
});
