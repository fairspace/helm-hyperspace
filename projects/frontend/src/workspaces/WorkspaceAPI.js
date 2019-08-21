import axios from 'axios';

import Config from "../common/services/Config/Config";
import {extractJsonData, handleHttpError} from "../common/utils/httpUtils";

class WorkspaceAPI {
    getWorkspaces() {
        return axios.get(Config.get().urls.workspaces, {headers: {Accept: 'application/json'}})
            .catch(handleHttpError("Failure when retrieving a list of workspaces"))
            .then(extractJsonData);
    }

}

export default new WorkspaceAPI();
