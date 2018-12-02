# Server

## Preconditions

* install node and make it available in your environment
    * https://nodejs.org/en/download/

## Before start

* put the krpano.js in this directory
  * you can download the krpano.zip here: https://krpano.com/download/
  * the unregistered version adds watermarks to the pano   
* change the config to your pano root directory

## Install Modules global

    npm i -g forever

## Install Modules local

    npm run i
or (is called implicit with the command above)

    yarn install

## Start Server
  
    forever start index.js
    
## Stop Server
  
    forever stop index.js
    
## Start Client
* start the client (see readme.md in client directory)

## Behind apache

At first: enable modules

    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo a2enmod proxy_balancer
    sudo a2enmod lbmethod_byrequests

change apache config, add i.E. following lines:

    ProxyRequests on
    ProxyPass /static/panos/ http://localhost:3000/static/panos/
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPass /panos http://localhost:3000/
    ProxyPass /panos/ http://localhost:3000/

restart apache

    sudo service apache2 restart    