import axios from 'axios';

import Config from "./Config/Config";
import {handleHttpError, extractJsonData} from "../utils/httpUtils";

const requestOptions = {
    headers: {Accept: 'application/json'}
};

class KeycloakAPI {
    getUsers() {
        return axios.get(Config.get().urls.keycloak.users, requestOptions)
            .catch(handleHttpError('Error while loading users'))
            .then(extractJsonData);
    }

    getRole(roleName) {
        return axios.get(Config.get().urls.keycloak.role.replace("{roleName}", roleName), requestOptions)
            .catch(handleHttpError('Error while loading role'))
            .then(extractJsonData);
    }

    getUsersForRole(roleName) {
        return axios.get(Config.get().urls.keycloak.usersForRole.replace("{roleName}", roleName), requestOptions)
            .catch(handleHttpError('Error while loading users for role'))
            .then(extractJsonData);
    }

    setRoleForUser(userId, roleId, roleName, hasRole = true) {
        const postBody = {
            id: roleId,
            name: roleName
        };

        const method = hasRole ? axios.post : axios.delete;

        return method(Config.get().urls.keycloak.roleMappings.replace("{userId}", userId), postBody, requestOptions)
            .catch(handleHttpError('Error while updating roles for user'));
    }

}

export default new KeycloakAPI();
