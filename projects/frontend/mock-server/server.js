const express = require('express');
require('dotenv').config();

// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const mockDataDir = path.join(__dirname, '/mock-data');
const port = process.env.MOCK_SERVER_PORT || 5001;
const app = express();

const workspaces = JSON.parse(fs.readFileSync(`${mockDataDir}/workspaces.json`));

// Add a delay to make the loading visible
// app.use((req, res, next) => setTimeout(next, 1000));

// parse application/json
app.use(bodyParser.json());

app.get('/api/v1/status/:httpStatus(\\d+)', (req, res) => res.status(req.params.httpStatus).send({status: req.params.httpStatus}));
app.get('/config/config.json', (req, res) => res.sendFile(`${mockDataDir}/hyperspace-config.json`));
app.get('/config/version.json', (req, res) => res.sendFile(`${mockDataDir}/version.json`));

app.get('/api/v1/account', (req, res) => res.sendFile(`${mockDataDir}/user.json`));
app.get('/api/v1/workspaces', (req, res) => res.sendFile(`${mockDataDir}/workspaces.json`));
app.put('/api/v1/workspaces', (req, res) => res.sendStatus(200));

app.post('/api/v1/search/*', (req, res) => res.sendFile(`${mockDataDir}/search.json`));

app.get('/api/v1/workspaces/:workspaceId', (req, res) => {
    const workspace = workspaces.find(w => w.id === req.params.workspaceId);

    if (workspace) {
        res.send(workspace);
    } else {
        res.sendStatus(404);
    }
});
app.get('/api/v1/workspaces/:workspaceId/apps', (req, res) => {
    const workspace = workspaces.find(w => w.id === req.params.workspaceId);

    if (workspace) {
        res.send(workspace.apps);
    } else {
        res.sendStatus(404);
    }
});
app.put('/api/v1/workspaces/:workspaceId/apps', (req, res) => res.sendStatus(200));
app.delete('/api/v1/workspaces/:workspaceId/apps/:appId', (req, res) => res.sendStatus(204));

app.get('/api/keycloak/roles/:roleName', (req, res) => res.sendFile(`${mockDataDir}/keycloak/role.json`));
app.get('/api/keycloak/roles/:roleName/users', (req, res) => {
    if (req.params.roleName.startsWith("coordinator")) {
        res.sendFile(`${mockDataDir}/keycloak/coordinators.json`);
    } else {
        res.sendFile(`${mockDataDir}/keycloak/users.json`);
    }
});

app.get('/api/keycloak/users', (req, res) => res.sendFile(`${mockDataDir}/keycloak/users.json`));
app.post('/api/keycloak/users/:userId/role-mappings/realm', (req, res) => res.sendStatus(204));
app.delete('/api/keycloak/users/:userId/role-mappings/realm', (req, res) => res.sendStatus(204));

app.listen(port);
