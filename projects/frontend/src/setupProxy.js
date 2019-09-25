const proxy = require('http-proxy-middleware');
require('dotenv').config();

const port = process.env.MOCK_SERVER_PORT || 5001;

const MOCKED_SERVER_URL = `http://localhost:${port}/`;

module.exports = (app) => {
    app.use(
        proxy(['/config', '/api'], {target: MOCKED_SERVER_URL})
    );
};
