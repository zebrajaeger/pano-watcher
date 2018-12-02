const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const xml2json = require('xml2json');

const port = 3000;
const panoRoot = 'd:/pano';


let fileList = [];

// ==================== helpers ====================

function log(msg, ...parms) {
    if (parms) {
        console.log(msg, parms);
    } else {
        console.log(msg);
    }
}

// ==================== http Server ====================
const app = express();
const router = express.Router();
// app.get('/', function (request, response) {
//     response.send('Hello World');
// });

app.use('/', express.static('../client'))
app.use('/panos', express.static(panoRoot))
app.use('/api', router);
router.get('/', (request, response) => {
    response.json(fileList);
});

app.listen(port, () => console.log('Listening on port ' + port));

// ==================== pano and dir parser ====================
function findPanoXml(dir) {
    let files = fs.readdirSync(dir).sort();

    for (let index in  files) {
        let file = files[index];
        let x = path.join(dir, file);
        if (path.extname(file).toLowerCase() === '.xml') {
            let xml = fs.readFileSync(x);
            let json = xml2json.toJson(xml, {object: true});
            if (json.krpano && json.krpano.preview && json.krpano.preview.url) {
                return {
                    name: path.basename(dir),
                    panoFile: file,
                    preview: json.krpano.preview.url
                }
            }
        }
    }
}

function updateFileList(dir) {
    let files = fs.readdirSync(dir);
    let updatedList = [];
    files.forEach(function (file) {
        let x = path.join(dir, file);
        if (fs.statSync(x).isDirectory()) {
            var panoFile = findPanoXml(x);
            if (panoFile) {
                updatedList.push(panoFile);
            } else {
                updateFileList(x);
            }
        }
    });
    fileList = updatedList.sort();
    //log(fileList);
}

// ==================== watcher ====================
let changed = false;
chokidar.watch('.', {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
    changed = true;
});

setInterval(function () {
    if (changed) {
        changed = false;
        updateFileList(panoRoot);
    }
}, 500);
