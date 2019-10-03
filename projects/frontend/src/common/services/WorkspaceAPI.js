import axios from 'axios';
import {extractJsonData, handleHttpError} from "@fairspace/shared-frontend";
import Config from "./Config";

const baseUrl = () => Config.get().urls.workspaces;
const workspaceUrl = workspaceId => baseUrl() + '/' + workspaceId;
const appsUrl = workspaceId => workspaceUrl(workspaceId) + '/apps';
const appUrl = (workspaceId, appId) => workspaceUrl(workspaceId) + '/apps/' + appId;

const defaultConfig = {headers: {'Accept': 'application/json', 'Content-type': 'application/json'}};

class WorkspaceAPI {
    getWorkspaces() {
        return axios.get(baseUrl(), defaultConfig)
            .catch(handleHttpError("Failure when retrieving a list of workspaces"))
            .then(extractJsonData);
    }

    getWorkspace(workspaceId) {
        return axios.get(workspaceUrl(workspaceId), defaultConfig)
            .catch(handleHttpError("Failure when retrieving workspace info for workspace " + workspaceId))
            .then(extractJsonData);
    }

    getAppsForWorkspace(workspaceId) {
        if (!workspaceId) {
            return Promise.reject(new Error("No workspace id specified"));
        }

        return axios.get(appsUrl(workspaceId), defaultConfig)
            .catch(handleHttpError("Failure when retrieving workspace info for workspace " + workspaceId))
            .then(extractJsonData);
    }

    createWorkspace(workspace) {
        return axios.put(baseUrl(), workspace, defaultConfig)
            .catch(handleHttpError("Failure when creating a workspace"));
    }

    updateWorkspace(workspace) {
        return axios.patch(baseUrl(), workspace, defaultConfig)
            .catch(handleHttpError("Failure when updating a workspace"));
    }

    deleteWorkspace(workspaceId) {
        return axios.delete(workspaceUrl(workspaceId), defaultConfig)
            .catch(handleHttpError(`Failure when deleting ${workspaceId}`));
    }

    addAppToWorkspace(workspaceId, appType) {
        const app = {
            id: appType + '-' + workspaceId,
            type: appType
        };


        return axios.put(appsUrl(workspaceId), app, defaultConfig)
            .catch(handleHttpError("Failure when adding an app " + app.id + " to workspace " + workspaceId));
    }

    removeAppFromWorkspace(workspaceId, appId) {
        return axios.delete(appUrl(workspaceId, appId))
            .catch(handleHttpError("Failure when deleting app " + appId));
    }
}

export default new WorkspaceAPI();
