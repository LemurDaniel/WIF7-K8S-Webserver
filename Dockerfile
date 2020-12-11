FROM node:alpine3.12

WORKDIR /var/project

#RUN npm install -g http-server

#Install Dependencies
RUN npm install -g browser-sync

RUN npm install express -d

RUN npm install path

RUN npm install body-parser

RUN npm install mysql

RUN npm install

#Define Workspace
RUN mkdir /var/project/src

WORKDIR /var/project/src

RUN cd /var/project/src

#Expose Port
EXPOSE 3000


CMD ["browser-sync", "start", "--server", "-f", "-w"]
