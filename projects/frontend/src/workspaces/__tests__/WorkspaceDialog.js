import React from 'react';
import {mount} from "enzyme";
import WorkspaceDialog from "../WorkspaceDialog";

describe('WorkspaceDialog', () => {
    let onSubmit;
    let wrapper;

    const enterValue = (type, id, value) => wrapper
        .find(type + '#' + id).simulate('change', {
            target: {value}
        });

    const enterIntoInput = (id, value) => enterValue('input', id, value);
    const enterIntoTextArea = (id, value) => enterValue('textarea', id, value);

    const submit = () => wrapper.find('form').simulate('submit');

    beforeEach(() => {
        onSubmit = jest.fn();
        wrapper = mount(<WorkspaceDialog onSubmit={onSubmit} />);
    });

    it('should send all entered parameters to the creation method', () => {
        enterIntoInput('id', 'a');
        enterIntoInput('name', 'b');
        enterIntoTextArea('description', 'c');
        enterIntoInput('logAndFilesVolumeSize', '4');
        enterIntoInput('databaseVolumeSize', '5');

        expect(wrapper.find('button[type="submit"]').prop("disabled")).toBe(false);

        submit();

        expect(onSubmit.mock.calls.length).toEqual(1);
        expect(onSubmit.mock.calls[0][0]).toEqual({
            id: 'a',
            name: 'b',
            description: 'c',
            logAndFilesVolumeSize: '4',
            databaseVolumeSize: '5'
        });
    });

    it('should require an identifier', () => {
        enterIntoInput('name', 'b');
        enterIntoTextArea('description', 'c');
        enterIntoInput('logAndFilesVolumeSize', '4');
        enterIntoInput('databaseVolumeSize', '5');

        expect(wrapper.find('button[type="submit"]').prop("disabled")).toBe(true);

        submit();

        expect(onSubmit.mock.calls.length).toEqual(0);
    });

    it('should require a name', () => {
        enterIntoInput('id', 'a');
        enterIntoTextArea('description', 'c');
        enterIntoInput('logAndFilesVolumeSize', '4');
        enterIntoInput('databaseVolumeSize', '5');

        expect(wrapper.find('button[type="submit"]').prop("disabled")).toBe(true);

        submit();

        expect(onSubmit.mock.calls.length).toEqual(0);
    });

    it('should require PV sizes larger than 0', () => {
        enterIntoInput('id', 'a');
        enterIntoInput('name', 'b');
        enterIntoTextArea('description', 'c');
        enterIntoInput('logAndFilesVolumeSize', '0');
        enterIntoInput('databaseVolumeSize', '5');

        expect(wrapper.find('button[type="submit"]').prop("disabled")).toBe(true);

        submit();

        expect(onSubmit.mock.calls.length).toEqual(0);
    });

    it('should require PV sizes larger than 0', () => {
        enterIntoInput('id', 'a');
        enterIntoInput('name', 'b');
        enterIntoTextArea('description', 'c');
        enterIntoInput('logAndFilesVolumeSize', '1');
        enterIntoInput('databaseVolumeSize', '0');

        expect(wrapper.find('button[type="submit"]').prop("disabled")).toBe(true);

        submit();

        expect(onSubmit.mock.calls.length).toEqual(0);
    });

});
