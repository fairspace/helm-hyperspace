import axios from 'axios';

import Config from "./Config/Config";
import {handleHttpError, extractJsonData} from "../utils/httpUtils";

const requestOptions = {
    headers: {Accept: 'application/json'}
};

class HyperspaceAPI {
    getVersion() {
        return axios.get(Config.get().urls.version, requestOptions)
            .catch(handleHttpError('Error while loading version details'))
            .then(extractJsonData);
    }
}

export default new HyperspaceAPI();
