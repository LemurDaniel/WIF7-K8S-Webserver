# //// recreate configMaps and secrets ////
$doodles_namespace = 'doodles-azure-ns'

./k8s-azure-aks/config/script.ps1 $doodles_namespace


# //// create kubernetes resources ////
kubectl apply -f ./k8s-azure-aks/


# // Change current context to new namespace //
kubectl config set-context (kubectl config current-context) --namespace=$doodles_namespace
kubectl port-forward svc/doodles-webserver-svc 443:443

# / And back /
# kubectl config set-context (kubectl config current-context) --namespace=default
