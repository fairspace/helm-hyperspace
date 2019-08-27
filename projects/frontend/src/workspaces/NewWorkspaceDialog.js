import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import React, {useState} from "react";
import Typography from "@material-ui/core/Typography";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";

const defaultValues = `
# Hyperspace that this workspace is connected to
hyperspace:
  domain: 
  keycloak:
    username: keycloak
    password: 
    realm: ci
    clientSecret: 

# Settings for the workspace
workspace:
  ingress:
    domain: 
  enableExperimentalFeatures: true
  configurationScripts:
    keycloak:
      enabled: true
      pullPolicy: IfNotPresent

services:
  jupyterhub: 

pluto:
  image:
    pullPolicy: Always
    
# Specific settings for Saturn subchart
saturn:
  image:
    pullPolicy: Always
  mail:
    mail.from: 
    mail.user: 
    mail.password: 
    mail.transport.protocol: smtp
    mail.smtp.auth: true
    mail.smtp.host: email-smtp.us-east-1.amazonaws.com
    mail.smtp.port: 587
    mail.smtp.starttls.enable: true


# Specific settings for Mercury subchart
mercury:
  image:
    pullPolicy: Always

# Specific settings for Mercury subchart
docs:
  image:
    pullPolicy: Always
`;

export default ({onCreate, onClose}) => {
    const [name, setName] = useState("");
    const [values, setValues] = useState(defaultValues);

    return (<Dialog
        open
        onClose={onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
        maxWidth="md"
    >
        <DialogTitle disableTypography id="form-dialog-title">
            <Typography variant="h5">Add a new Workspace</Typography>
            <Typography variant="subtitle1">Specify parameters for the new Workspace</Typography>
        </DialogTitle>
        <DialogContent style={{overflowX: 'hidden'}}>
            <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Name"
                value={name}
                name="name"
                onChange={(event) => setName(event.target.value)}
                fullWidth
                required
            />
            <TextField
                multiline
                margin="dense"
                id="values"
                label="Values"
                value={values}
                name="values"
                onChange={(event) => setValues(event.target.value)}
                fullWidth
                required
            />
        </DialogContent>
        <DialogActions>
            <Button
                onClick={onClose}
                color="secondary"
            >
                Cancel
            </Button>
            <Button
                onClick={() => onCreate({name, values})}
                color="primary"
                variant="contained"
            >
                Create
            </Button>
        </DialogActions>
    </Dialog>)
};
