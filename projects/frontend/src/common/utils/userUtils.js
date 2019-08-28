import Config from "../services/Config/Config";

export const getDisplayName = (user) => (user && user.name) || '';

export const isOrganisationAdmin = (userRoles) => userRoles && userRoles.includes(Config.get().roles.organisationAdmin);

export const isWorkspaceUser = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.user + workspace);

export const isWorkspaceCoordinator = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.coordinator + workspace);

export const isWorkspaceDatasteward = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.datasteward + workspace);

export const isWorkspaceSparql = (userRoles, workspace) => userRoles && workspace && !!userRoles.find(r => r === Config.get().rolesPrefixes.sparql + workspace);
