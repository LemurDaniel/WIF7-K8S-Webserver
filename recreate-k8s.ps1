# //// recreate configMaps and secrets ////
$doodles_namespace = 'doodles-ns'

./k8s-local/config/script.ps1 $doodles_namespace

# Configurations can be found in ./k8s-local/config/
# Self-signed certificates for testing HTTPS can be created via ./docker/gen-certs/script.txt
# Private / Public key pair for JWT-Signing can be created via ./docker/gen-certs/script.txt


# //// delete existing volumes ////
# kubectl delete -f ./k8s-local/k8s-pv-db.yaml
# kubectl delete -f ./k8s-local/k8s-pv-web.yaml


# //// create kubernetes resources ////
kubectl apply -f ./k8s-local/

kubectl scale --replicas 0 deploy doodles-webserver --namespace=$doodles_namespace
kubectl scale --replicas 1 deploy doodles-webserver --namespace=$doodles_namespace

# // Change current context to new namespace //
kubectl config set-context (kubectl config current-context) --namespace=$doodles_namespace
kubectl port-forward svc/doodles-webserver-svc 443 80

# / And back /
# kubectl config set-context (kubectl config current-context) --namespace=default