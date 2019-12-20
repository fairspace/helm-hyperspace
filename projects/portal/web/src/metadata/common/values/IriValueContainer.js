import React, {useContext} from "react";
import PropTypes from 'prop-types';
import {Grid, TextField} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

import BaseInputValue from "./BaseInputValue";
import LinkedDataContext from "../../LinkedDataContext";

export const noNamespace = {
    id: '',
    label: '(no namespace)',
    value: ''
};

export const IriValue = ({
    namespace,
    namespaces = [],
    localPart = '',
    onNamespaceChange = () => {},
    onLocalPartChange = () => {}
}) => {
    const namespaceOptions = [
        noNamespace,
        ...namespaces.map(n => ({
            id: n.id,
            label: n.label,
            value: n.namespace,
            isDefault: n.isDefault
        }))
    ];

    const defaultNamespace = namespaceOptions.find(n => n.isDefault) || noNamespace;

    if (!namespace) {
        onNamespaceChange(defaultNamespace);
    }

    return (
        <Grid container alignItems="flex-end" justify="space-between" spacing={1}>
            <Grid item xs={4}>
                <Autocomplete
                    options={namespaceOptions}
                    value={namespace || defaultNamespace}
                    onChange={(e, v) => {
                        onNamespaceChange(v);
                    }}
                    getOptionDisabled={option => option.disabled}
                    getOptionLabel={option => option.label}
                    renderInput={(props) => <TextField fullWidth {...props} />}
                />
            </Grid>
            <Grid item xs={8} style={{paddingTop: 8, paddingBottom: 0}}>
                <BaseInputValue
                    property={{}}
                    entry={{value: localPart}}
                    onChange={e => onLocalPartChange(e.value)}
                    type="url"
                />
            </Grid>
        </Grid>
    );
};

IriValue.propTypes = {
    localPart: PropTypes.string,
    namespace: PropTypes.object,
    onLocalPartChange: PropTypes.func,
    onNamespaceChange: PropTypes.func,
    namespaces: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            prefix: PropTypes.string,
            namespace: PropTypes.string
        })
    )
};

export default props => {
    const {namespaces} = useContext(LinkedDataContext);
    return <IriValue namespaces={namespaces} {...props} />;
};
