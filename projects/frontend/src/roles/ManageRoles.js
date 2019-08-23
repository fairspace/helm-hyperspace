import React, {useState} from 'react';
import {
    Card, Select, MenuItem, Grid, List, ListItem,
    ListItemText, CardHeader, CardContent, Checkbox, FormGroup, FormControlLabel
} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';

const styles = {
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    cardRoot: {
        minWidth: 340,
        maxWidth: 400,
        height: '100%',
    },
};

const ManageRoles = ({classes}) => {
    const [selectedUser, setSelecteduser] = useState(null);
    const [selectedRoles, setSelectedRoles] = React.useState({});

    const workspaces = ['Workspace1', 'Workspace2', 'Workspace3'];
    const users = ['John', 'Joe', 'Mo', 'Bo'];
    const roles = ['Regular User', 'Data Steward', 'SPARQL'];

    const handleRoleChange = role => event => {
        setSelectedRoles(prev => ({...prev, [role]: event.target.checked}));
    };

    return (
        <div className={classes.root}>
            <Card className={classes.cardRoot}>
                {/* <CardHeader title="Workspaces" /> */}
                <CardContent>
                    <Select
                        value={workspaces[0]}
                        inputProps={{
                            name: 'workspaces',
                            id: 'workspaces',
                        }}
                        style={{width: '100%'}}
                    >
                        {workspaces.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </Select>
                </CardContent>
            </Card>
            <Grid
                container
                alignItems="stretch"
                spacing={4}
                style={{marginTop: 20}}
            >
                <Grid item>
                    <Card className={classes.cardRoot}>
                        <CardHeader title="Users" />
                        <List component="ul" aria-label="users">
                            {
                                users.map(user => (
                                    <ListItem
                                        button
                                        selected={selectedUser === user}
                                        onClick={() => setSelecteduser(user)}
                                    >
                                        <ListItemText primary={user} />
                                    </ListItem>
                                ))
                            }
                        </List>
                    </Card>
                </Grid>
                <Grid item>
                    <Card className={classes.cardRoot}>
                        <CardHeader title="Roles" />
                        <CardContent>
                            <List component="ul" aria-label="roles">
                                {
                                    roles.map(role => (
                                        <FormGroup>
                                            <FormControlLabel
                                                control={(
                                                    <Checkbox
                                                        checked={selectedRoles[role]}
                                                        onChange={handleRoleChange}
                                                        value={role}
                                                    />
                                                )}
                                                label={role}
                                            />
                                        </FormGroup>
                                    ))
                                }
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default withStyles(styles)(ManageRoles);
