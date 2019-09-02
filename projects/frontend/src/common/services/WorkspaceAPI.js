import axios from 'axios';

import Config from "./Config/Config";
import {extractJsonData, handleHttpError} from "../utils/httpUtils";

class WorkspaceAPI {
    getWorkspaces() {
        return axios.get(Config.get().urls.workspaces, {headers: {Accept: 'application/json'}})
            .catch(handleHttpError("Failure when retrieving a list of workspaces"))
            .then(extractJsonData);
    }

    createWorkspace(workspace) {
        return axios.put(Config.get().urls.workspaces, workspace, {headers: {'Content-type': 'application/json'}})
            .catch(handleHttpError("Failure when creating a workspace"));
    }
}

export default new WorkspaceAPI();
