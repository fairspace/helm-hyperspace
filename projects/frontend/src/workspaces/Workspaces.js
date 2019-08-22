import React, {useState} from 'react';
import BreadCrumbs from "../common/components/BreadCrumbs";
import BreadcrumbsContext from "../common/contexts/BreadcrumbsContext";
import WorkspaceList from "./WorkspaceList";
import Button from "@material-ui/core/Button";
import NewWorkspaceDialog from "./NewWorkspaceDialog";
import WorkspaceAPI from "./WorkspaceAPI";

export default () => {
    const [addingWorkspace, setAddingWorkspace] = useState(false);

    const createWorkspace = (workspace) => {
        setAddingWorkspace(false);
        WorkspaceAPI.createWorkspace(workspace);
    };

    return (
    <>
        <BreadcrumbsContext.Provider value={{
            segments: [{
                label: 'Workspaces',
                icon: 'folder_open',
                href: '/workspaces'
            }]
        }}
        >
            <BreadCrumbs />
            <WorkspaceList />
            <Button
                style={{marginTop: 8}}
                color="primary"
                variant="contained"
                aria-label="Add"
                title="Create a new workspace"
                disabled={addingWorkspace}
                onClick={() => setAddingWorkspace(true)}
            >
                New
            </Button>
            {addingWorkspace && <NewWorkspaceDialog
                onCreate={createWorkspace}
                onClose={() => setAddingWorkspace(false)}
            />}
        </BreadcrumbsContext.Provider>
    </>
)};
