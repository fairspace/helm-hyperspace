import KeycloakAPI from "../common/services/KeycloakAPI";
import DebouncedSelect from "./DebouncedSelect";

export default props => {
    const fetchItems = ({size, query}) => KeycloakAPI.searchUsers({size, query})
        .then(
            items => items.map(user => {
                const {id, firstName, lastName} = user;
                const displayLabel = (firstName + ' ' + lastName).trim();
                return {
                    label: displayLabel,
                    id,
                    user
                };
            })
        );

    return DebouncedSelect({...props, fetchItems});
};
