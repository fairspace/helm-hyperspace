import React, {useCallback, useContext} from 'react';
import PropTypes from 'prop-types';
import {withRouter} from "react-router-dom";
import {
    BreadCrumbs, LoadingInlay, MessageDisplay, useAsync, usePageTitleUpdater, UserContext
} from "@fairspace/shared-frontend";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Grid from "@material-ui/core/Grid";
import AppBreadcrumbsContextProvider from "./AppBreadcrumbsContextProvider";
import {isOrganisationAdmin} from "../common/utils/userUtils";
import WorkspaceAPI from "../common/services/WorkspaceAPI";

/**
 * This page will show information about a single app
 *
 * @param {*} workspace
 */
const AppPage = ({workspaceId, appId}) => {
    if (!workspaceId || !appId) throw Error("WorkspaceId and appId should be provided to AppPage");

    usePageTitleUpdater(workspaceId + " - " + appId);

    const {currentUser, currentUserLoading, currentUserError} = useContext(UserContext);
    const {error, loading, data} = useAsync(useCallback(() => WorkspaceAPI.getAppsForWorkspace(workspaceId), [workspaceId]));

    if (!isOrganisationAdmin(currentUser.authorizations)) {
        return <MessageDisplay message={`You do not have access to release information for apps in ${workspaceId}.`} />;
    }

    if (loading || currentUserLoading) {
        return <LoadingInlay />;
    }

    if (error || currentUserError) {
        return <MessageDisplay message="Unable to retrieve the information about this app." />;
    }

    const app = data.find(a => a.id === appId);

    if (!app) {
        return <MessageDisplay message="App not found" />;
    }

    return (
        <AppBreadcrumbsContextProvider workspaceId={workspaceId} appId={app.id} appType={app.type}>
            <BreadCrumbs />
            <Grid container spacing={10}>
                <Grid item>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Identifier"
                                secondary={app.id}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Type"
                                secondary={app.type}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Workspace"
                                secondary={workspaceId}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Version"
                                secondary={app.version}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="URL"
                                secondary={<a href={app.url}>{app.url}</a>}
                            />
                        </ListItem>
                    </List>
                </Grid>

                <Grid item>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Release status"
                                secondary={app.release.status}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Release description"
                                secondary={app.release.description}
                            />
                        </ListItem>
                    </List>
                </Grid>
            </Grid>
        </AppBreadcrumbsContextProvider>
    );
};

AppPage.propTypes = {
    workspaceId: PropTypes.string.isRequired,
    appId: PropTypes.string.isRequired
};

export default withRouter(AppPage);
