import React, {useCallback, useContext} from 'react';
import PropTypes from 'prop-types';
import {Link} from "react-router-dom";
import {List, ListItem, ListItemText, Grid} from "@material-ui/core";
import {
    BreadCrumbs, LoadingInlay, MessageDisplay, useAsync, usePageTitleUpdater, UserContext
} from "@fairspace/shared-frontend";

import {isOrganisationAdmin} from "../common/utils/userUtils";
import WorkspaceAPI from "../common/services/WorkspaceAPI";
import WorkspaceBreadcrumbsContextProvider from "./WorkspaceBreadcrumbsContextProvider";

/**
 * This page will show information about a single workspace
 *
 * @param {*} workspace
 */
const WorkspacePage = ({workspaceId}) => {
    if (!workspaceId) throw Error("WorkspaceId should be provided to WorkspacePage");

    usePageTitleUpdater(workspaceId);

    const {currentUser, currentUserLoading, currentUserError} = useContext(UserContext);
    const {error, loading, data} = useAsync(useCallback(() => WorkspaceAPI.getWorkspace(workspaceId), [workspaceId]));

    if (!isOrganisationAdmin(currentUser.authorizations)) {
        return <MessageDisplay message={`You do not have access to release information for in ${workspaceId}.`} />;
    }

    if (loading || currentUserLoading) {
        return <LoadingInlay />;
    }

    if (error || currentUserError) {
        return <MessageDisplay message="Unable to retrieve the information about this workspace." />;
    }

    return (
        <WorkspaceBreadcrumbsContextProvider workspaceId={workspaceId}>
            <BreadCrumbs />
            <Grid container spacing={40}>
                <Grid item>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Identifier"
                                secondary={data.id}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Name"
                                secondary={data.name}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Description"
                                secondary={data.description}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Version"
                                secondary={data.version}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="URL"
                                secondary={<a href={data.url}>{data.url}</a>}
                            />
                        </ListItem>
                    </List>
                </Grid>

                <Grid item>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Release status"
                                secondary={data.release.status}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Release description"
                                secondary={data.release.description}
                            />
                        </ListItem>
                    </List>
                </Grid>

                <Grid item>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Apps"
                                secondary={<Link to={`/workspaces/${workspaceId}/apps`}>{data.apps.length ? data.apps.map(app => app.type).join(", ") : "No apps"}</Link>}
                            />
                        </ListItem>
                    </List>
                </Grid>
            </Grid>
        </WorkspaceBreadcrumbsContextProvider>
    );
};

WorkspacePage.propTypes = {
    workspaceId: PropTypes.string.isRequired
};

export default WorkspacePage;
