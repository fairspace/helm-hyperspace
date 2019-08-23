const proxy = require('http-proxy-middleware');
require('dotenv').config();

const port = process.env.MOCK_SERVER_PORT || 5001;

module.exports = (app) => {
    app.use(proxy('/config', {target: `http://localhost:${port}/`}));
    app.use(proxy('/api/v1/account', {target: `http://localhost:${port}/`}));
    app.use(proxy('/api/v1/workspaces', {target: `http://localhost:${port}/`}));

    app.use(proxy('/api/v1', {target: 'http://localhost:8080/'}));
};
