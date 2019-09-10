import {renderHook} from "@testing-library/react-hooks";
import {useRoles} from "../useRoles";
import {roles} from "../roleUtils";

const workspacename = 'workspace';

describe('useRoles', () => {
    it('should return information for all roles', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => Promise.resolve({id: '123', name: role}))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, keycloakAPI));
        await waitForNextUpdate();

        expect(Object.values(result.current.roles).map(role => role.name)).toEqual(
            expect.arrayContaining(roles.map(role => role + '-' + workspacename))
        );
    });

    it('should return loading if any of the requests is still pending', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => (role === 'user-workspace' ? new Promise(() => {}) : Promise.resolve({id: '123', name: role})))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.loading).toEqual(true);
    });

    it('should return error if any of the requests returns an error', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => (role === 'user-workspace' ? Promise.reject() : Promise.resolve({id: '123', name: role})))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.error).toEqual(true);
    });
});
