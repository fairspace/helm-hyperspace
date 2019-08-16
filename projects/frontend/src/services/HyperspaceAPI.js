import axios from 'axios';

import Config from "./Config/Config";
import {handleHttpError, extractJsonData} from "../utils/httpUtils";

const requestOptions = {
    headers: {Accept: 'application/json'}
};

class HyperspaceAPI {
    getHyperspace() {
        return axios.get(Config.get().urls.hyperspace, requestOptions)
            .catch(handleHttpError('Error while loading workspace details'))
            .then(extractJsonData);
    }
}

export default new HyperspaceAPI();
