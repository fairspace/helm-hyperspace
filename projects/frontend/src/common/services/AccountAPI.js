import axios from 'axios';

import Config from "./Config/Config";
import {extractJsonData, handleHttpError} from "../utils/httpUtils";

class AccountAPI {
    getUser() {
        return axios.get(Config.get().urls.userInfo)
            .catch(handleHttpError("Failure when retrieving username"))
            .then(extractJsonData)
    }
}

export default new AccountAPI();
