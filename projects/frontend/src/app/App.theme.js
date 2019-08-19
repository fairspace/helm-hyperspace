import {createMuiTheme} from "@material-ui/core";
import {green, lightGreen, red} from "@material-ui/core/colors";

export default createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: process.env.NODE_ENV === 'development' ? lightGreen : green,
        secondary: red
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
