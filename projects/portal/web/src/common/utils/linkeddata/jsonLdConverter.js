import {compareBy, comparing, flattenShallow, isNonEmptyValue} from '@fairspace/shared-frontend';

import * as constants from "../../../constants";
import {getFirstPredicateId, normalizeJsonLdResource} from "./jsonLdUtils";
import {isRdfList, determineShapeForProperty} from "./vocabularyUtils";
import {simplifyUriPredicates} from "./metadataUtils";

/**
 * Generates an entry to describe a single value for a property
 * @param entry
 * @param allMetadata
 * @returns {{id: *, label, value: *}}
 */
const generateValueEntry = (entry, allMetadata) => ({
    id: entry['@id'],
    value: entry['@value'],
    otherEntry: entry['@id'] ? simplifyUriPredicates(normalizeJsonLdResource(allMetadata.find(element => element['@id'] === entry['@id']))) : {}
});

/**
 * Converts a JSON-LD structure into a list of values per predicate
 * @param metadata Expanded JSON-LD metadata about a single subject. The subject must have a '@type' property
 * @param propertyShapes List of propertyShapes that should be included
 * @param allMetadata All known metadata to be processed. Is used to retrieve labels for associated entities
 * @returns {Array}
 */
export const fromJsonLd = (metadata, propertyShapes = [], allMetadata = []) => {
    const valuesByPredicate = {};

    const expectsRdfList = predicateUri => {
        const propertyShape = propertyShapes
            .find(shape => getFirstPredicateId(shape, constants.SHACL_PATH) === predicateUri);
        return propertyShape && isRdfList(propertyShape);
    };

    Object.keys(metadata)
        .forEach(predicateUri => {
            // Ensure that we have a list of values for the predicate
            if (!Array.isArray(metadata[predicateUri])) {
                return;
            }

            let values;

            if (predicateUri === '@type') {
                // Treat @type as special case, as it does not have the correct
                // format (with @id or @value)
                values = metadata[predicateUri].map(t => ({id: t}));
            } else if (expectsRdfList(predicateUri)) {
                // RDF lists in JSON LD are arrays in a container with key '@list'
                // We want to use just the arrays. If there are multiple lists
                // they are concatenated
                // Please note that entries are not sorted as rdf:lists are meant to be ordered
                values = flattenShallow(metadata[predicateUri].map(
                    entry => (entry['@list'] ? entry['@list'] : [entry])
                )).map(entry => generateValueEntry(entry, allMetadata));
            } else {
                // Convert json-ld values into our internal format and
                // sort the values
                values = metadata[predicateUri]
                    .map(entry => generateValueEntry(entry, allMetadata))
                    .sort(comparing(compareBy(e => e.otherEntry && e.otherEntry.label), compareBy('id'), compareBy('value')));
            }

            valuesByPredicate[predicateUri] = values;
        });

    return valuesByPredicate;
};

/**
 * Returns the given values in the right container. By default, no container is used
 * If the predicate requires an rdf:List, the values are put into a {'@list': ...} object
 * Whevever the data type is available it will be sent for values that are not part of RDF List
 * @param values
 * @param shape
 * @returns {*}
 */
const jsonLdWrapper = (values, shape) => {
    if (isRdfList(shape)) {
        return {
            '@list': values.map(({id, value}) => ({'@id': id, '@value': value}))
        };
    }

    const dataType = getFirstPredicateId(shape, constants.SHACL_DATATYPE);

    return values.map(({id, value}) => ({'@id': id, '@value': value, "@type": dataType}));
};

/**
 * Converts information for a subject and predicate into json-ld
 * @param subject       Subject URI
 * @param predicate     Predicate URI
 * @param values        List of values for the given predicate. Expected keys: id or value
 * @param vocabulary    vocabularyUtils in expanded json-ld format
 * @returns {*}
 */
export const toJsonLd = (subject, predicate, values, vocabulary) => {
    if (!subject || !predicate || !values) {
        return null;
    }

    const validValues = values.filter(({id, value}) => isNonEmptyValue(value) || !!id);

    // Return special nil value if no values or if all values are empty or invalid (non-truthy except zero or false)
    if (validValues.length === 0) {
        return {
            '@id': subject,
            [predicate]: {'@id': constants.NIL_URI}
        };
    }

    return {
        '@id': subject,
        [predicate]: jsonLdWrapper(validValues, determineShapeForProperty(vocabulary, predicate))
    };
};

/**
 * Extracts the metadata that describes the given subject from the given metadata
 * @param expandedMetadata
 * @param subject
 * @returns {*|{}}
 */
export const getJsonLdForSubject = (expandedMetadata, subject) => {
    if (!Array.isArray(expandedMetadata) || (!subject && expandedMetadata.length !== 1)) {
        console.warn("Can not combine metadata for multiple subjects at a time. Provide an expanded JSON-LD structure for a single subject");
        return {};
    }

    return expandedMetadata.find(item => item['@id'] === subject) || {};
};

/**
 * Replaces all occurrences of rdf:type with @type
 * @param expandedMetadata
 * @returns {*}
 */
export const normalizeTypes = (expandedMetadata) => expandedMetadata.map(e => {
    if (!e['@type'] && e[constants.RDF_TYPE]) {
        const {[constants.RDF_TYPE]: types, ...rest} = e;
        return {
            '@type': types.map(t => t['@id']),
            ...rest
        };
    }
    return e;
});
