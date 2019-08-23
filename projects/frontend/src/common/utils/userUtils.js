export const getDisplayName = (user) => (user && user.name) || '';

export const Roles = {
    ADMIN: 'Admin',
    USER: 'User',
    COORDINATOR: 'Coordinator',
    DATASTEWARD: 'Datasteward',
    SPARQL: 'Sparql'
};

export const isOrganisationAdmin = (userRoles, workspace, {roles}) => userRoles && userRoles.includes(roles.organisationAdmin);

export const isWorkspaceUser = (userRoles, workspace, {rolesPrefixes}) => userRoles && workspace && !!userRoles.find(r => r === rolesPrefixes.user + workspace);

export const isWorkspaceCoordinator = (userRoles, workspace, {rolesPrefixes}) => userRoles && workspace && !!userRoles.find(r => r === rolesPrefixes.coordinator + workspace);

export const isWorkspaceDatasteward = (userRoles, workspace, {rolesPrefixes}) => userRoles && workspace && !!userRoles.find(r => r === rolesPrefixes.datasteward + workspace);

export const isWorkspaceSparql = (userRoles, workspace, {rolesPrefixes}) => userRoles && workspace && !!userRoles.find(r => r === rolesPrefixes.sparql + workspace);

export const userHasRole = (role, userRoles, workspace, config) => {
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
