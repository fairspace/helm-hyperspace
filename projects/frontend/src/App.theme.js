import {createMuiTheme} from "@material-ui/core";
import {lightBlue, blueGrey} from "@material-ui/core/colors";

export default createMuiTheme({
    palette: {
        primary: process.env.NODE_ENV === 'development' ? {main: blueGrey.A200} : blueGrey,
        secondary: lightBlue
    },
    props: {
        MuiMenu: {
            elevation: 1
        }
    }
});
