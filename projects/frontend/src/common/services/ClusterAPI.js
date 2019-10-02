import axios from 'axios';
import {extractJsonData, handleHttpError} from "@fairspace/shared-frontend";
import Config from "./Config";

const defaultConfig = {headers: {'Accept': 'application/json', 'Content-type': 'application/json'}};

class ClusterAPI {
    getClusterInformation() {
        return axios.get(Config.get().urls.clusterInfo, defaultConfig)
            .catch(handleHttpError("Failure when retrieving cluster information"))
            .then(extractJsonData);
    }
}

export default new ClusterAPI();
