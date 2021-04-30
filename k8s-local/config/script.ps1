param([string] $doodles_namespace=$(throw "Please specify a namespace."))

kubectl create ns $doodles_namespace

kubectl delete secret ssl.cert.data --namespace=$doodles_namespace
kubectl delete secret jwt.rsa.data  --namespace=$doodles_namespace
kubectl delete secret jwt.enc.conf  --namespace=$doodles_namespace
kubectl delete secret sql.pass.data --namespace=$doodles_namespace

kubectl delete -f ./k8s-local/config/k8s-app-config.yaml

# 	 /// Generate secrets and configMap///
#
#1. Create Secret: ssl.cert.data
#
#   / cert and key from file /

    kubectl create secret generic ssl.cert.data `
             --from-file=./k8s-local/config/certs/ssl.cert.pem `
             --from-file=./k8s-local/config/certs/ssl.key.pem `
             --namespace=$doodles_namespace
#
#
#2. Create Secret: jwt.rsa.data
#
#    / private + public key from file /

    kubectl create secret generic jwt.rsa.data `
             --from-file=./k8s-local/config/certs/jwt.private.pem `
             --from-file=./k8s-local/config/certs/jwt.public.pem `
             --namespace=$doodles_namespace
            
#
#
#3. Create Secret: jwt.enc.data
#
#    / keys from env file /

    kubectl create secret generic jwt.enc.conf `
             --from-env-file=./k8s-local/config/k8s-jwt-config.env `
             --namespace=$doodles_namespace


#4. Create Secret: sql.pass.data
#
#    / keys from env file /

    kubectl create secret generic sql.pass.data `
            --from-env-file=./k8s-local/config/k8s-sql-config.env `
            --namespace=$doodles_namespace


#5. Create config-map: node.webserver.config

    kubectl apply -f ./k8s-local/config/k8s-app-config.yaml
