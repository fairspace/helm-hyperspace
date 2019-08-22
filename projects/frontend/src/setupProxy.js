const proxy = require('http-proxy-middleware');

module.exports = (app) => {
    app.use(proxy('/config', {target: 'http://localhost:5001/'}));
    app.use(proxy('/api/v1/account', {target: 'http://localhost:5001/'}));
    app.use(proxy('/api/v1/workspaces', {target: 'http://localhost:5001/'}));

    app.use(proxy('/api/v1', {target: 'http://localhost:8080/'}));
};
