$resource_group = "wif7-testing"

Install-AzAksKubectl

./k8s-azure-aks/arm-templates/deploy.ps1 $resource_group

Import-AzAksCredential -ResourceGroupName $resource_group -Name "doodles-cluster"

