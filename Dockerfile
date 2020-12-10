FROM node:alpine3.12

RUN npm install -g http-server

RUN npm install -g browser-sync

RUN mkdir /var/src

WORKDIR /var/src

RUN cd /var/src

EXPOSE 3000

CMD ["browser-sync", "start", "--server", "-f", "-w"]