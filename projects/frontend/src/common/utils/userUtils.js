export default function getDisplayName(user) {
    return (user && user.name) || '';
}

export const isOrganisationAdmin = (authorizations, config) => authorizations && authorizations.includes(config.roles.organisationAdmin);
export const isWorkspaceCoordinator = (authorizations, config) => authorizations && authorizations.includes(config.roles.workspaceCoordinator);
