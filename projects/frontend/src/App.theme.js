import {createMuiTheme} from "@material-ui/core";
import {lightBlue, blueGrey} from "@material-ui/core/colors";

export default createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: process.env.NODE_ENV === 'development' ? {main: blueGrey.A200} : blueGrey,
        secondary: lightBlue
    },
    props: {
        MuiPaper: {
            square: true,
            elevation: 1
        },
        MuiMenu: {
            elevation: 2
        }
    }
});
