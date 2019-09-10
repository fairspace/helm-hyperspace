import Config from "../services/Config/Config";

export const getDisplayName = (user) => (user && user.name) || '';

export const isOrganisationAdmin = (authorizations) => authorizations && authorizations.includes(Config.get().roles.organisationAdmin);

export const getRoleName = (role, workspace) => role + '-' + workspace;

export const isWorkspaceUser = (authorizations, workspace) => authorizations && workspace
    && authorizations.includes(getRoleName(Config.get().workspaceRoles.user, workspace));

export const isWorkspaceCoordinator = (authorizations, workspace) => authorizations && workspace
    && authorizations.includes(getRoleName(Config.get().rolesPrefixes.coordinator, workspace));
