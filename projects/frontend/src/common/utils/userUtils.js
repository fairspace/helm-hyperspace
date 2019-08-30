import Config from "../services/Config/Config";

export const getDisplayName = (user) => (user && user.name) || '';

export const isOrganisationAdmin = (authorizations) => authorizations && authorizations.includes(Config.get().roles.organisationAdmin);

export const isWorkspaceUser = (authorizations, workspace) => authorizations && workspace
    && !!authorizations.find(a => a === Config.get().rolesPrefixes.user + workspace);

export const isWorkspaceCoordinator = (authorizations, workspace) => authorizations && workspace
    && !!authorizations.find(a => a === Config.get().rolesPrefixes.coordinator + workspace);

export const isWorkspaceDatasteward = (authorizations, workspace) => authorizations && workspace
    && !!authorizations.find(a => a === Config.get().rolesPrefixes.datasteward + workspace);

export const isWorkspaceSparql = (authorizations, workspace) => authorizations && workspace
    && !!authorizations.find(a => a === Config.get().rolesPrefixes.sparql + workspace);

export const userHasAnyRoleInWorkspace = (authorizations, workspace) => !!workspace
    && (isWorkspaceUser(authorizations, workspace)
        || isWorkspaceCoordinator(authorizations, workspace)
        || isWorkspaceDatasteward(authorizations, workspace)
        || isWorkspaceSparql(authorizations, workspace));

/**
 * Reducer to return an object of mapped ids to roles
 * @param accumulator
 * @param user
 * @returns {}
 */
export const idToRoles = (accumulator, {id, authorizations}) => ({
    ...accumulator,
    [id]: new Set(authorizations)
});
