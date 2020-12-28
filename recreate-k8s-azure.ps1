$resource_group = "wif7-testing"

Install-AzAksKubectl

./k8s-azure/arm-templates/deploy.ps1

Import-AzAksCredential -ResourceGroupName $resource_group -Name "doodles-cluster"

# //// recreate configMaps and secrets ////
$doodles_namespace = 'doodles-azure-ns'

./k8s-azure/config/script.ps1 $doodles_namespace


# //// create kubernetes resources ////
kubectl apply -f ./k8s-azure/


# // Change current context to new namespace //
kubectl config set-context (kubectl config current-context) --namespace=$doodles_namespace
kubectl port-forward svc/doodles-webserver-svc 443:443

# / And back /
# kubectl config set-context (kubectl config current-context) --namespace=default


# // Kubernetes Services with NodePort don't seem to work on 'docker for desktop', port-forwarding does: //
# kubectl port-forward svc/doodles-webserver-svc 6000:443
# kubectl port-forward svc/doodles-database-svc 6001:3306

# // if on Chrome: port 443 has to be used for https //
# => kubectl port-forward svc/doodles-webserver-svc 443:443 

# / OR explicitly allow port 6000 top be open /
# => Press: win + r
# => Enter: C:\Program Files (x86)\Google\Chrome\Application\chrome.exe --explicitly-allowed-ports=6000