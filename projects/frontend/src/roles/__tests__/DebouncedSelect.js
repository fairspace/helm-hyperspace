import React from 'react';
import {shallow} from "enzyme";
import DebouncedSelect from "../DebouncedSelect";
import MaterialReactSelect from "../../common/components/MaterialReactSelect";

describe('DebouncedSelect', () => {
    const fetchItems = jest.fn(() => Promise.resolve([{label: 'test'}]));

    it('should debounce searching', () => {
        jest.useFakeTimers();

        const wrapper = shallow(<DebouncedSelect fetchItems={fetchItems} debounce={100} />);
        const loadFunc = wrapper.find(MaterialReactSelect).prop("loadOptions");

        // Ensure a fresh mock
        fetchItems.mockClear();

        // Call 3 times
        loadFunc('a');
        loadFunc('b');
        loadFunc('c');

        // Fast-forward until all timers have been executed
        jest.runAllTimers();

        // Wait a bit and check whether the original method was called only once
        expect(fetchItems.mock.calls.length).toEqual(1);
        expect(fetchItems.mock.calls[0][0].query).toEqual('c');
    });
});
