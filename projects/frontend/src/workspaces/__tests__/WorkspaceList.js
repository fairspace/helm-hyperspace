import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {render, cleanup, getByTestId, waitForElement, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {act} from 'react-dom/test-utils';
import {UserContext} from '@fairspace/shared-frontend';

import {WorkspaceList} from '../WorkspaceList';
import Config from '../../common/services/Config';
import configFile from '../../config';

afterEach(cleanup);

beforeAll(() => {
    Config.setConfig(Object.assign(configFile, {
        externalConfigurationFiles: [],
    }));

    return Config.init();
});

const authorizations = [
    'user-workspace',
    'datasteward-workspace',
    'coordinator-workspace',
    'organisation-admin'
];

const readyWorkspaces = [
    {
        id: 'workspace',
        name: 'Example workspace',
        description: 'Workspace description',
        url: 'http://localhost:3000',
        version: '0.6.1',
        logAndFilesVolumeSize: 1024,
        databaseVolumeSize: 1024,
        release: {
            status: 'DEPLOYED',
            description: 'Install complete',
            ready: true
        }
    }
];

const notReadyWorkspaces = [
    {
        id: 'workspace',
        name: 'Example workspace',
        description: 'Workspace description',
        url: 'http://localhost:3000',
        version: '0.6.1',
        logAndFilesVolumeSize: 1024,
        databaseVolumeSize: 1024,
        release: {
            status: 'DEPLOYED',
            description: 'Install complete',
            ready: false
        }
    }
];

describe('WorkspaceList', () => {
    const wrap = (element, availableAuthorizations = []) => (
        <MemoryRouter>
            <UserContext.Provider value={{currentUser: {authorizations: availableAuthorizations}}}>
                {element}
            </UserContext.Provider>
        </MemoryRouter>
    );

    it('fetches workspaces on render', async () => {
        const workspaceApi = {
            getWorkspaces: jest.fn(() => Promise.resolve())
        };

        await act(async () => {
            const component = wrap(<WorkspaceList getWorkspaces={workspaceApi.getWorkspaces} />);
            render(component);
        });

        expect(workspaceApi.getWorkspaces.mock.calls.length).toEqual(1);
    });

    it('all action items enabled when user admin and workspace is ready', async () => {
        const workspaceApi = {
            getWorkspaces: jest.fn(() => Promise.resolve(readyWorkspaces))
        };

        await act(async () => {
            const component = wrap(<WorkspaceList
                classes={{}}
                getWorkspaces={workspaceApi.getWorkspaces}
            />, authorizations);
            const {container, findByTestId} = render(component);

            const actionsButton = await waitForElement(
                () => getByTestId(container, 'actions-buttton'),
                {container}
            );

            fireEvent.click(actionsButton);

            const configMenuItem = await findByTestId('config-menu-item');
            const rolesMenuItem = await findByTestId('roles-menu-item');
            const appsMenuItem = await findByTestId('apps-menu-item');

            // This one doesn't work as Mui doesn't assign the 'disabled' attribute even if the component is a button!
            // expect(rolesMenuItem).toBeDisabled();

            expect(configMenuItem.className).not.toMatch(/MuiButtonBase-disabled/);
            expect(rolesMenuItem.className).not.toMatch(/MuiButtonBase-disabled/);
            expect(appsMenuItem.className).not.toMatch(/MuiButtonBase-disabled/);
        });
    });

    it('all action items disabled when the workspace is not ready', async () => {
        const workspaceApi = {
            getWorkspaces: jest.fn(() => Promise.resolve(notReadyWorkspaces))
        };

        await act(async () => {
            const component = wrap(<WorkspaceList
                classes={{}}
                getWorkspaces={workspaceApi.getWorkspaces}
            />, authorizations);
            const {container, findByTestId} = render(component);

            const actionsButton = await waitForElement(
                () => getByTestId(container, 'actions-buttton'),
                {container}
            );

            fireEvent.click(actionsButton);

            const configMenuItem = await findByTestId('config-menu-item');
            const rolesMenuItem = await findByTestId('roles-menu-item');
            const appsMenuItem = await findByTestId('apps-menu-item');

            // This one doesn't work as Mui doesn't assign the 'disabled' attribute even if the component is a button!
            // expect(rolesMenuItem).toBeDisabled();

            expect(configMenuItem.className).toMatch(/MuiButtonBase-disabled/);
            expect(rolesMenuItem.className).toMatch(/MuiButtonBase-disabled/);
            expect(appsMenuItem.className).toMatch(/MuiButtonBase-disabled/);
        });
    });

    it('can manage roles if workspace coordinator and workspace is ready', async () => {
        const workspaceApi = {
            getWorkspaces: jest.fn(() => Promise.resolve(readyWorkspaces))
        };

        await act(async () => {
            const component = wrap(<WorkspaceList
                classes={{}}
                getWorkspaces={workspaceApi.getWorkspaces}
            />, 'coordinator-workspace');
            const {container, findByTestId} = render(component);

            const actionsButton = await waitForElement(
                () => getByTestId(container, 'actions-buttton'),
                {container}
            );

            fireEvent.click(actionsButton);

            const rolesMenuItem = await findByTestId('roles-menu-item');

            expect(rolesMenuItem.className).not.toMatch(/MuiButtonBase-disabled/);
        });
    });
});
