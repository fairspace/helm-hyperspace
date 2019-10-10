import React, {useContext, useState} from "react";
import {UserContext} from "@fairspace/shared-frontend";
import {isOrganisationAdmin} from "./common/utils/userUtils";
import ClusterHealthBar from "./common/components/ClusterHealthBar";
import Routes from "./Routes";

export default () => {
    const [dismissed, setDismissed] = useState(false);
    const {currentUser: {authorizations}} = useContext(UserContext);

    return (
        <>
            {!dismissed && isOrganisationAdmin(authorizations) ? <ClusterHealthBar onDismiss={() => setDismissed(true)} /> : undefined}
            <Routes />
        </>
    );
};
