const express = require('express');
require('dotenv').config();

// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const path = require('path');

const mockDataDir = path.join(__dirname, '/mock-data');
const port = process.env.MOCK_SERVER_PORT || 5001;
const app = express();

// Add a delay to make the loading visible
// app.use((req, res, next) => setTimeout(next, 1000));

// parse application/json
app.use(bodyParser.json());

app.get('/api/v1/status/:httpStatus(\\d+)', (req, res) => res.status(req.params.httpStatus).send({status: req.params.httpStatus}));
app.get('/config/config.json', (req, res) => res.sendFile(`${mockDataDir}/hyperspace-config.json`));
app.get('/config/version.json', (req, res) => res.sendFile(`${mockDataDir}/version.json`));

app.get('/api/v1/account', (req, res) => res.sendFile(`${mockDataDir}/user.json`));
app.get('/api/v1/workspaces', (req, res) => res.sendFile(`${mockDataDir}/workspaces.json`));
app.put('/api/v1/workspaces', (req, res) => res.status(200));

app.listen(port);
