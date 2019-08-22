# Organisation portal frontend
This application contains a portal UI for within a hyperspace. The UI is based on [Material UI](https://material-ui.com/).

### Running the app in development mode
The app needs a backend to communicate with. For convenience, there are a few scripts to use for local development:

- `yarn server:mock` starts a mock backend server at port 5001. It can be configured in the file `mock-server/server.js`
- `yarn start` starts the frontend and exposes it at port 3001

An additional command is available to start all components needed for local development at once: 

    `yarn dev` 

This will start:
- Portal backend (JDK 11 required)
- Mock server
- Frontend
- Unit tests (yarn test)

To open the app point to http://localhost:3000/

All commands require you to have [yarn](https://yarnpkg.com/lang/en/) installed. 

If there is no vocabulary in present in the workspace, you might have ran saturn prior to starting ES before. Stop the services, remove `../saturn/data/` and restart. The vocabulary should then be visible in the workspace.

### External configuration
This application loads external configuration from the url `/config/config.json`. This file can locally be 
served by the `server/server.js` stub. By default it only contains the url to access the storage on.

### React
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app). See [REACT.md](REACT.md) for more information.

### Linting
The project has extended the eslint configuration by React. At the moment it is not enforced and therefore it is recommended to use a plugin for eslint in your favorite IDE. The rules can be found and therefore modified in the .eslintrc.json file.

You can also run eslint manually by doing:
```
.\node_modules\.bin\eslint <DIRECTORY/FILE LOCATION>
```
