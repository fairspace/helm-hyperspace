import {createMuiTheme} from "@material-ui/core";
import indigo from "@material-ui/core/colors/indigo";
import pink from "@material-ui/core/colors/pink";
import blue from '@material-ui/core/colors/blue';

export default createMuiTheme({
    palette: {
        primary: process.env.NODE_ENV === 'development' ? blue : indigo,
        secondary: pink
    },
    props: {
        MuiMenu: {
            elevation: 1
        }
    },
    overrides: {
        // needed to avoid: https://github.com/mui-org/material-ui/issues/18082
        MuiAutocomplete: {
            popup: {zIndex: 1300},
        },
    },
});
