# //// recreate configMaps and secrets ////
$doodles_namespace = 'doodles-ns'

./k8s/config/script.ps1 $doodles_namespace

# Configurations can be found in ./k8s/config/
# Self-signed certificates for testing HTTPS can be created via ./docker/gen-certs/script.txt
# Private / Public key pair for JWT-Signing can be created via ./docker/gen-certs/script.txt


# //// delete existing volumes ////
# kubectl delete -f ./k8s/k8s-pv-db.yaml
# kubectl delete -f ./k8s/k8s-pv-web.yaml


# //// create kubernetes resources ////
kubectl apply -f ./k8s/


# // Change current context to new namespace //
kubectl config set-context (kubectl config current-context) --namespace=$doodles_namespace
kubectl port-forward svc/doodles-webserver-svc 443:443

# / And back /
kubectl config set-context (kubectl config current-context) --namespace=default


# // Kubernetes Services with NodePort don't seem to work on 'docker for desktop', port-forwarding does: //
# kubectl port-forward svc/doodles-webserver-svc 6000:443
# kubectl port-forward svc/doodles-database-svc 6001:3306

# // if on Chrome: port 443 has to be used for https //
# => kubectl port-forward svc/doodles-webserver-svc 443:443 

# / OR explicitly allow port 6000 top be open /
# => Press: win + r
# => Enter: C:\Program Files (x86)\Google\Chrome\Application\chrome.exe --explicitly-allowed-ports=6000