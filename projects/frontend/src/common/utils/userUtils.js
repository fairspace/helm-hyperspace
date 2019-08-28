import Config from "../services/Config/Config";

export const getDisplayName = (user) => (user && user.name) || '';

export const Roles = {
    ADMIN: 'Admin',
    USER: 'User',
    COORDINATOR: 'Coordinator',
    DATASTEWARD: 'Datasteward',
    SPARQL: 'Sparql'
};

// export const isOrganisationAdmin = (userRoles, workspace, {roles}) => userRoles && userRoles.includes(roles.organisationAdmin);
export const isOrganisationAdmin = (userRoles) => userRoles && userRoles.includes(Config.get().roles.organisationAdmin);

export const isWorkspaceUser = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.user + workspace);

// export const isWorkspaceCoordinator = (authorizations) => authorizations && authorizations.includes(Config.get().roles.workspaceCoordinator);
export const isWorkspaceCoordinator = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.coordinator + workspace);

export const isWorkspaceDatasteward = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.datasteward + workspace);

export const isWorkspaceSparql = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.sparql + workspace);

export const userHasRole = (role, userRoles, workspace) => {
    const config = Config.get();

    switch (role) {
        case Roles.ADMIN:
            return isOrganisationAdmin(userRoles, workspace, config);
        case Roles.USER:
            return isWorkspaceUser(userRoles, workspace, config);
        case Roles.COORDINATOR:
            return isWorkspaceCoordinator(userRoles, workspace, config);
        case Roles.DATASTEWARD:
            return isWorkspaceDatasteward(userRoles, workspace, config);
        case Roles.SPARQL:
            return isWorkspaceSparql(userRoles, workspace, config);
        default:
            throw new Error('Role unknown.');
    }
};
