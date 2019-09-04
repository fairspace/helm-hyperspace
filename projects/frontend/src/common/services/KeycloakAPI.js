import axios from 'axios';

import Config from "./Config/Config";
import {handleHttpError, extractJsonData} from "../utils/httpUtils";

const requestOptions = {
    headers: {Accept: 'application/json'}
};

class KeycloakAPI {
    getUsers() {
        return axios.get(Config.get().urls.users, requestOptions)
            .catch(handleHttpError('Error while loading users'))
            .then(extractJsonData);
    }
}

export default new KeycloakAPI();
