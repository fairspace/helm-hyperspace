import Config from "../services/Config/Config";

export default function getDisplayName(user) {
    return (user && user.name) || '';
}

export const isOrganisationAdmin = (authorizations) => authorizations && authorizations.includes(Config.get().roles.organisationAdmin);
export const isWorkspaceCoordinator = (authorizations) => authorizations && authorizations.includes(Config.get().roles.workspaceCoordinator);
