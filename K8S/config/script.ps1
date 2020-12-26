kubectl delete secret ssl.cert.data
kubectl delete secret jwt.rsa.data
kubectl delete secret jwt.enc.conf
kubectl delete secret sql.pass.data

kubectl delete -f ./k8s/config/k8s-app-config.yaml

# 	 /// Generate secrets and configMap///
#
#1. Create Secret: ssl.cert.data
#
#   / cert and key from file /

    kubectl create secret generic ssl.cert.data `
             --from-file=./docker/gen-certs/ssl.cert.pem `
             --from-file=./docker/gen-certs/ssl.key.pem
#
#
#2. Create Secret: jwt.rsa.data
#
#    / private + public key from file /

    kubectl create secret generic jwt.rsa.data `
             --from-file=./docker/gen-certs/jwt.private.pem `
             --from-file=./docker/gen-certs/jwt.public.pem `
            
#
#
#3. Create Secret: jwt.enc.data
#
#    / keys from env file /

    kubectl create secret generic jwt.enc.conf `
             --from-env-file=./k8s/config/k8s-jwt-config.env


#4. Create Secret: sql.pass.data
#
#    / keys from env file /

    kubectl create secret generic sql.pass.data `
            --from-env-file=./k8s/config/k8s-sql-config.env


#5. Create config-map: node.webserver.config

    kubectl apply -f ./k8s/config/k8s-app-config.yaml



#6. View secret
#
#    kubectl get secret ssl.cert.data
#    or
#    kubectl get secret ssl.cert.data -o yaml
#
#7. (OPTIONAL) Save YAML to file:
#
#    kubectl get secret ssl.cert.data -o yaml| Out-File -FilePath .\K8S\k8s-ssl-cert-data.yaml