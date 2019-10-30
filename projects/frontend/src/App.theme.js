import {createMuiTheme} from "@material-ui/core";
import {blue, blueGrey} from "@material-ui/core/colors";

export default createMuiTheme({
    palette: {
        primary: process.env.NODE_ENV === 'development' ? {main: blueGrey.A200} : blueGrey,
        secondary: blue
    },
    props: {
        MuiMenu: {
            elevation: 1
        }
    }
});
