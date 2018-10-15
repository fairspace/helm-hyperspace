# A Helm chart for VRE hyperspace
This helm chart will install and setup a VRE hyperspace, including keycloak. 

See `hyperspace/README.md` for more information

# Deployment scripts
Deployment scripts can be found in the `ci` directory. They are
run by travis-ci, as setup in the `travis.yml` file.

Please note that the `kube-config.yml` file is encrypted as described
in the [travis documentation](https://docs.travis-ci.com/user/encrypting-files/). The
file contains configuration for `kubectl` that points to the azure cluster. The context 
is set to 'azure-context', whose cluster points to `https://fairspacecluster-4493cdc7.hcp.westeurope.azmk8s.io:443`  
