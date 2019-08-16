import React, {useContext} from 'react';
import PropTypes from "prop-types";
import {Link as RouterLink} from 'react-router-dom';
import {Breadcrumbs, Icon, Link} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';
import BreadcrumbsContext from "./BreadcrumbsContext";
import usePageTitleUpdater from '../UsePageTitleUpdater';

/**
 * Renders a list of breadcrumbs
 *
 * @param segments  Segments of the breadcrumbs after the first 'home' entry
 * @param match     Match of the current route, provided by react-router
 * @param classes   Classes for styling. Provided by material-ui withStyles
 * @returns {Array}
 * @constructor
 */
const BreadCrumbs = ({classes, additionalSegments = []}) => {
    const {segments: contextSegments} = useContext(BreadcrumbsContext);
    const allSegments = [...contextSegments, ...additionalSegments];

    usePageTitleUpdater(allSegments);

    return (
        <Breadcrumbs aria-label="Breadcrumb" className={classes.root}>
            {allSegments.map(({label, icon, href}, idx) => (
                <Link
                    component={RouterLink}
                    className={classes.link}
                    color={idx === allSegments.length - 1 ? 'textPrimary' : 'inherit'}
                    key={href}
                    to={href}
                >
                    {icon ? <Icon className={classes.icon}>{icon}</Icon> : undefined}
                    {label}
                </Link>
            ))}
        </Breadcrumbs>
    );
};

BreadCrumbs.propTypes = {
    additionalSegments: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.string,
            href: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired
        })
    )
};

const styles = theme => ({
    root: {
        padding: `${theme.spacing()}px ${theme.spacing(2)}px`,
        display: 'flex'
    },
    link: {
        display: 'flex',
    },
    icon: {
        marginRight: theme.spacing(),
        width: 24,
        height: 24,
    }
});

export default withStyles(styles)(BreadCrumbs);
