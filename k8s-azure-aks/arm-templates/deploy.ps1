param([string] $resourceGroupName=$(throw "Please specify a resourcegroup."))

$templateFile = "./k8s-azure-aks/arm-templates/deploy.json"
$templateParameterFile = "./k8s-azure-aks/arm-templates/deploy.parameters.json"

# Create new Resource Group
New-AzResourceGroup -Name $resourceGroupName -Location "germanywestcentral"

# Get Principal Id for k8s App
$principal = (Get-AzADServicePrincipal -DisplayName doodles-drawing).Id

# Assign role for k8s principal
New-AzRoleAssignment -ObjectId $principal `
    -RoleDefinitionName Contributor `
    -ResourceGroupName $resourceGroupName

New-AzResourceGroupDeployment -ResourceGroupName $resourceGroupName `
                                -TemplateFile $templateFile `
                                -TemplateParameterFile $templateParameterFile