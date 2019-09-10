import {renderHook} from "@testing-library/react-hooks";
import {useRoles} from "../useRoles";

const workspacename = 'workspace';
const roles = ['user', 'coordinator', 'otherrole', 'datasteward'];

describe('useRoles', () => {
    it('should return information for all roles', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => Promise.resolve({id: 123, name: role}))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, roles, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.roles).toEqual(
            {
                user: {id: 123, name: 'user-workspace'},
                coordinator: {id: 123, name: 'coordinator-workspace'},
                otherrole: {id: 123, name: 'otherrole-workspace'},
                datasteward: {id: 123, name: 'datasteward-workspace'},
            }
        );
    });

    it('should return loading if any of the requests is still pending', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => (role === 'user-workspace' ? new Promise(() => {}) : Promise.resolve({id: '123', name: role})))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, roles, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.loading).toEqual(true);
    });

    it('should return error if any of the requests returns an error', async () => {
        const keycloakAPI = {
            getRole: jest.fn((role) => (role === 'user-workspace' ? Promise.reject() : Promise.resolve({id: '123', name: role})))
        };

        const {result, waitForNextUpdate} = renderHook(() => useRoles(workspacename, roles, keycloakAPI));
        await waitForNextUpdate();

        expect(result.current.error).toEqual(true);
    });
});
