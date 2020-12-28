$resource_group = "wif7-project-k8s"

Install-AzAksKubectl

# Specify service principal in deploy.parameter.json ! and change diskuri in pv-db
./k8s-azure-aks/arm-templates/deploy.ps1 $resource_group

Import-AzAksCredential -ResourceGroupName $resource_group -Name "doodles-cluster"

