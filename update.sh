#!/usr/bin/env bash

cd server
npm run server-stop
cd ..
git pull
cd client
npm run i
npm run build
cd ../server
npm run i
npm run server-start
