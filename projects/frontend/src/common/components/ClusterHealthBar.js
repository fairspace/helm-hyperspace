import React from 'react';
import PropTypes from 'prop-types';
import {useAsync} from "@fairspace/shared-frontend";
import ClusterAPI from "../services/ClusterAPI";
import useRepeat from "../hooks/UseRepeat";
import ErrorBanner from "./ErrorBanner";

const ClusterHealthBar = ({onDismiss}) => {
    // Load cluster information on startup and refresh the cluster information regularly
    const {data, loading, error, refresh} = useAsync(ClusterAPI.getClusterInformation);
    useRepeat(refresh, 30000);

    if (loading) {
        // While loading, never show any message
        return null;
    }

    if (error) {
        return (
            <ErrorBanner
                onDismiss={onDismiss}
                onRefresh={refresh}
                message="An error occurred while retrieving cluster information"
                showRefreshButton={true}
            />
        );
    } if (data.numUnschedulable) {
        return (
            <ErrorBanner
                onDismiss={onDismiss}
                message="The cluster seems to have problems handling new workspaces. Workspace creation or app installations may fail. Please contact an administrator"
            />
        );
    }

    // If there are no unschedulable pods, don't show any message
    return null;
};

ClusterHealthBar.propTypes = {
    onDismiss: PropTypes.func
};

export default ClusterHealthBar;
