# Custom Fairspace themes for Keycloak

Keycloak allows customising the look and feel of the web pages, including login, account or admin console, by providing custom themes.
Keycloak provides default themes that can be extended or overridden by custom themes. A theme consists of a set of resources, such as HTML templates, CSS, JavaScript, images, message bundles and theme properties.

More information about custom themes can be found in the [Keycloak documentation](https://www.keycloak.org/docs/latest/server_development/#_theme_stylesheet).


## Fairspace theme

This directory contains the custom Fairspace theme for Keycloak. The theme is based on the default theme called "keycloak" and includes custom styles and a logo.

The theme is packaged into a Docker image and made available in the Kubernetes setup using init container as theme provider. 

More information about the theme setup with Kubernetes and Helm can be found in [Keycloakx Helm chart documentation](https://github.com/codecentric/helm-charts/tree/master/charts/keycloakx#providing-a-custom-theme).

### Selecting Fairspace theme for user login page
To use a Fairspace theme for the user login page, the `fairspace_theme` needs to be selected in the Keycloak admin console,
in the Fairspace client settings.
The theme should be configured under *Client details >> Settings >> Login settings >> Login theme*.

To have the Fairspace logo displayed on the login page, the *HTML Display name* needs to be changed to:
```
<div class="kc-logo-text"><span>Fairspace</span></div>
```
in *Realm settings >> General >> HTML Display name*.
