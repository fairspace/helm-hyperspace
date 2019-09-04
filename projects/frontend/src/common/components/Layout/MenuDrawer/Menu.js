import React from 'react';
import {NavLink, withRouter} from "react-router-dom";
import {Icon, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import FolderOpen from "@material-ui/icons/FolderOpen";

// The usage of React.forwardRef will no longer be required for react-router-dom v6.
// see https://github.com/ReactTraining/react-router/issues/6056
// see https://material-ui.com/components/buttons/#third-party-routing-library
const AdapterNavLink = React.forwardRef((props, ref) => <NavLink innerRef={ref} {...props} />);

const Menu = ({location: {pathname}}) => (
    <>
        <List>
            <ListItem
                component={AdapterNavLink}
                to="/"
                button
                selected={pathname === '/'}
            >
                <ListItemIcon>
                    <Icon>home</Icon>
                </ListItemIcon>
                <ListItemText primary="Home" />
            </ListItem>

            <ListItem
                component={AdapterNavLink}
                to="/workspaces"
                selected={pathname.startsWith('/workspaces')}
            >
                <ListItemIcon>
                    <FolderOpen />
                </ListItemIcon>
                <ListItemText primary="Workspaces" />
            </ListItem>

        </List>
    </>
);

export default withRouter(Menu);
