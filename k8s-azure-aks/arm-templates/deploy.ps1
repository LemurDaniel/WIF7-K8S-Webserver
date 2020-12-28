param([string] $resourceGroupName=$(throw "Please specify a resourcegroup."))

$templateFile = "./k8s-azure-aks/arm-templates/deploy.json"
$templateParameterFile = "./k8s-azure-aks/arm-templates/deploy.parameters.json"

New-AzResourceGroup -Name $resourceGroupName -Location "germanywestcentral"

New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName `
                                -TemplateFile $templateFile `
                                -TemplateParameterFile $templateParameterFile