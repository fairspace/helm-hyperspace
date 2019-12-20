import React from 'react';
import {mount} from "enzyme";

import ContextualReferringValue, {ReferringValue} from "../ReferringValue";
import LinkedDataLink from "../../LinkedDataLink";
import LinkedDataContext from "../../../LinkedDataContext";

describe('ReferringValue', () => {
    it('should render an external link directly', () => {
        const property = {
            isGenericIriResource: true,
            isExternalLink: true
        };
        const entry = {
            id: 'https://thehyve.nl'
        };
        expect(ReferringValue({
            property, entry
        })).toEqual(<a href="https://thehyve.nl">https://thehyve.nl</a>);
    });

    it('should render a generic iri resource as link to editor', () => {
        const property = {
            isGenericIriResource: true,
            isExternalLink: false
        };
        const entry = {
            id: 'https://thehyve.nl'
        };

        const editorPath = '/editor';

        expect(ReferringValue({
            property, entry, editorPath
        })).toEqual(<LinkedDataLink editorPath={editorPath} uri="https://thehyve.nl">https://thehyve.nl</LinkedDataLink>);
    });

    it('should render a regular links with the label of the resource', () => {
        const property = {};
        const entry = {
            id: 'https://my-resource',
            label: 'My resource'
        };

        const editorPath = '/editor';

        expect(ReferringValue({
            property, entry, editorPath
        })).toEqual(<LinkedDataLink editorPath={editorPath} uri="https://my-resource">My resource</LinkedDataLink>);
    });

    it('should render a values without URI as its label', () => {
        const property = {};
        const entry = {
            label: 'My resource'
        };

        const editorPath = '/editor';

        expect(ReferringValue({
            property, entry, editorPath
        })).toEqual('My resource');
    });

    it('should use the editorPath from the context', () => {
        const property = {isExternalLink: true};
        const entry = {
            id: 'https://my-resource',
            label: 'My resource'
        };

        const editorPath = '/editor';

        const wrapper = mount(<LinkedDataContext.Provider value={{editorPath}}><ContextualReferringValue property={property} entry={entry} />)</LinkedDataContext.Provider>);
        const referringValue = wrapper.find(ReferringValue);
        expect(referringValue.length).toEqual(1);
        expect(referringValue.prop("editorPath")).toEqual(editorPath);
    });
});
