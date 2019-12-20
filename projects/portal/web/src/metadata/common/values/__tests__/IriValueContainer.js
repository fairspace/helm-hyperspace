import React from 'react';
import {shallow} from "enzyme";
import Autocomplete from '@material-ui/lab/Autocomplete';

import {IriValue} from "../IriValueContainer";

describe('IriValueContainer', () => {
    it('should render a dropdown with namespaces', () => {
        const namespaces = [
            {id: 'a', label: 'RDF', prefix: 'rdf', namespace: 'http://rdf'},
            {id: 'b', label: 'Fairspace', namespace: 'http://fairspace.io/ontology#'}
        ];
        const wrapper = shallow(<IriValue namespaces={namespaces} />);
        const select = wrapper.find(Autocomplete);

        expect(select.length).toEqual(1);
        expect(select.prop('options')).toEqual([
            {
                id: '',
                label: '(no namespace)',
                value: ''
            },
            {
                id: 'a',
                label: 'RDF',
                value: 'http://rdf'
            },
            {
                id: 'b',
                label: 'Fairspace',
                value: 'http://fairspace.io/ontology#'
            }
        ]);
    });

    it('should render a dropdown when no namespaces are given', () => {
        const wrapper = shallow(<IriValue />);
        const select = wrapper.find(Autocomplete);

        expect(select.length).toEqual(1);
        expect(select.prop('options')).toEqual([
            {
                id: '',
                label: '(no namespace)',
                value: ''
            }
        ]);
    });
});
