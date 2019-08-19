import React from 'react';
import {withRouter} from "react-router-dom";
import {Icon, List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";

const Menu = ({location: {pathname}}) => (
    <>
        <List>
            <ListItem
                to="/"
                button
                selected={pathname === '/'}
            >
                <ListItemIcon>
                    <Icon>home</Icon>
                </ListItemIcon>
                <ListItemText primary="Home" />
            </ListItem>
        </List>
    </>
);

export default withRouter(Menu);
