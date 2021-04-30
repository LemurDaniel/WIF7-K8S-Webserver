
## Build dockerfiles

<details><br>

### Build browsersync:
*Automatically reloads browser after modifiying html, css and js files*

    docker build -t node-webserver:dev-bsync -f ./docker/df-bsync .

### Build nodejs webserver:

    docker build -t daniellandau1998/node-webserver:k8s -f ./docker/df-webserver .
    docker build -t daniellandau1998/node-webserver:dev -f ./docker/df-webserver .

### Run docker-compose:
  
     docker-compose -f ./docker/dc-web-db.yaml up

</details>


___



## Generate Self-signed SSL for local-testing

<details><br>

#### Create docker image with openssl installed:

    docker build -t gen_ssl:v1 -f df-ssl .

#### Spin up Container with localfolder mounted:

    docker run -v "C:\Users\Daniel Notebook\Documents\Git\Projekt\docker\gen-certs:/var/project/cert" -it gen_ssl:v1 bash

#### Enter following command:

    openssl req -config ssl.key.conf -days 365 \
            -new -x509 -newkey rsa:2048 -nodes \
            -keyout ssl.key.pem -out ssl.cert.pem

#### Import ***.cert.pem file into windows Cert-Manager:

    search windows for "Computerzertifikate verwalten"

    Go to "Vertrauenswürdige Stammzertifizierungsstellen"

    Import the ***.cert.pem file

</details>


___



## Generate Private / Public Key pair for JWT signing

<details><br>

#### Generate private key:
        
        openssl genrsa -out jwt.private.pem 512

#### Generate public key:

        openssl rsa -in jwt.private.pem -outform PEM -pubout -out jwt.public.pem

</details>