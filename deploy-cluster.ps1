$resource_group = "wif7-project-k8s"

Install-AzAksKubectl

# Specify service principal in deploy.parameter.json ! and change diskuri in pv-db
./k8s-azure-aks/arm-templates/deploy.ps1 $resource_group

# Import credentials to $HOME/.kube/config
Import-AzAksCredential -ResourceGroupName $resource_group -Name "doodles-cluster" -Admin

# Change diskURI and storagekeys in ./k8s-azure/config