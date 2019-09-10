import {renderHook} from "@testing-library/react-hooks";
import {useWorkspaceUsers} from "../useWorkspaceUsers";

const workspacename = 'workspace';
const roles = ['user', 'coordinator', 'otherrole', 'datasteward'];

describe('useWorkspaceUsers', () => {
    it('should return loading if any of the requests is still pending', async () => {
        const keycloakAPI = {
            getUsersForRole: (role) => (role === 'user-workspace' ? new Promise(() => {}) : Promise.resolve([]))
        };

        const {result, waitForNextUpdate} = renderHook(() => useWorkspaceUsers(workspacename, roles, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.loading).toEqual(true);
    });

    it('should return error if any of the requests returns an error', async () => {
        const keycloakAPI = {
            getUsersForRole: (role) => (role === 'user-workspace' ? Promise.reject() : Promise.resolve([]))
        };

        const {result, waitForNextUpdate} = renderHook(() => useWorkspaceUsers(workspacename, roles, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.error).toEqual(true);
    });

    describe('user lists', () => {
        const users = {
            user: [
                {id: 1, name: 'John'},
                {id: 2, name: 'Jane'},
                {id: 3, name: 'Simon'},
                {id: 4, name: 'Mary'},
            ],
            coordinator: [
                {id: 2, name: 'Jane'},
                {id: 3, name: 'Simon'}
            ],
            datasteward: [
                {id: 3, name: 'Simon'},
                {id: 5, name: 'Non-user'}
            ],
            otherrole: [
                {id: 2, name: 'Jane'},
                {id: 4, name: 'Mary'},
                {id: 6, name: 'Organisation-admin'}
            ]
        };

        const keycloakAPI = {
            getUsersForRole: (role) => Promise.resolve(users[role.replace('-' + workspacename, '')])
        };

        it('should only return all users with the user role', async () => {
            const {result, waitForNextUpdate} = renderHook(() => useWorkspaceUsers(workspacename, roles, keycloakAPI));
            await waitForNextUpdate();

            expect(result.current.users.map(u => u.name)).toEqual(expect.arrayContaining(['John', 'Jane', 'Simon', 'Mary']));
        });

        it('should add authorizations for all other roles', async () => {
            const {result, waitForNextUpdate} = renderHook(() => useWorkspaceUsers(workspacename, roles, keycloakAPI));
            await waitForNextUpdate();

            expect(result.current.users).toEqual(expect.arrayContaining([
                {id: 1, name: 'John', authorizations: {user: true, coordinator: false, datasteward: false, otherrole: false}},
                {id: 2, name: 'Jane', authorizations: {user: true, coordinator: true, datasteward: false, otherrole: true}},
                {id: 3, name: 'Simon', authorizations: {user: true, coordinator: true, datasteward: true, otherrole: false}},
                {id: 4, name: 'Mary', authorizations: {user: true, coordinator: false, datasteward: false, otherrole: true}},
            ]));
        });

        it('should refresh the user list if asked for', async () => {
            let coordinators;

            const {result, waitForNextUpdate} = renderHook(() => useWorkspaceUsers(workspacename, roles, keycloakAPI));
            await waitForNextUpdate();

            coordinators = result.current.users.filter(u => u.authorizations.coordinator);
            expect(coordinators.length).toEqual(2);
            expect(coordinators.map(c => c.name)).toEqual(expect.arrayContaining(["Jane", "Simon"]));

            // Overwrite response for coordinators
            users.coordinator = [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}];

            // Refresh coordinators
            result.current.refresh('coordinator');

            await waitForNextUpdate();

            coordinators = result.current.users.filter(u => u.authorizations.coordinator);
            expect(coordinators.length).toEqual(2);
            expect(coordinators.map(c => c.name)).toEqual(expect.arrayContaining(["John", "Jane"]));
        });
    });
});
