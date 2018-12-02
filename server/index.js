const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const xml2json = require('xml2json');
const jimp = require('jimp');

const port = 3000;
//const panoRoot = 'd:/pano';
const panoRoot = 'panos';

let panos = [];

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

// static stuff
app.use('/static/panos', express.static(panoRoot))
app.use('/', express.static('../client'))

// api
app.get('/api/panos/', handlePanos);
app.get('/api/panos/:id', handlePano);
app.get('/api/panos/:id/preview', handlePreview);
app.get('/api/panos/:id/meta', handleMeta);

app.listen(port, () => console.log('Listening on port ' + port));

function handlePanos(request, response, next) {
    response.json(panos);
}
function handlePano(request, response, next) {
    let id = request.params.id;
    let pano = findPano(id);
    if (pano == null) {
        response.status(404).send(`Pano with id: '${id}' not found`);
        return;
    } else {
        response.json(pano);
    }
}

function handleMeta(request, response, next) {
    let id = request.params.id;
    let pano = findPano(id);
    if (pano == null) {
        response.status(404).send(`Pano with id: '${id}' not found`);
        return;
    } else if (!pano.meta) {
        response.status(404).send(`Meta for pano with id: '${id}' not found`);
        return;
    } else {
        response.json(pano.meta);
    }
}

// ==================== PREVIEW ====================
function handlePreview(request, response, next) {
    let options = {
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    let id = request.params.id;
    let pano = findPano(id);
    if (pano == null || !pano.preview) {
        response.status(404).send(`Pano with id: '${id}' not found`);
        return;
    }

    let pathOriginal = __dirname + `/panos/${id}/${pano.preview}`;
    let pathScaled = pathOriginal + '_preview.png';

    if (!fs.existsSync(pathOriginal)) {
        response.status(404).send('Preview not found');
        return;
    }

    if (!fs.existsSync(pathScaled)) {
        jimp.read(pathOriginal)
            .then(img => {
                return img
                    .scaleToFit(256, 256)
                    .quality(90)
                    .write(pathScaled);
            })
            .catch(err => {
                console.error(err);
            });
    }

    let result = fs.existsSync(pathScaled) ? pathScaled : pathOriginal;
    response.sendFile(result, options, function (err) {
        if (err) {
            next(err);
        }
    });

//response.send('Hello World');
}

// ==================== pano and dir parser ====================
function findPano(id) {
    let result = null;
    panos.forEach(pano => {
        if (pano.name === id) {
            result = pano;
        }
    });
    return result;
}

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

function findDescriptionXml(dir) {
    let files = fs.readdirSync(dir).sort();

    for (let index in  files) {
        let file = files[index];
        let x = path.join(dir, file);
        if (path.extname(file).toLowerCase() === '.xml') {
            let xml = fs.readFileSync(x);
            let json = xml2json.toJson(xml, {object: true});
            if (json.description) {
                return {
                    file: file,
                    title: json.description.title,
                    text: json.description.text
                }
            }
        }
    }
}

/**
 * scan directories recursive
 * @param dir
 */
function updatePanoList(dir) {
    let files = fs.readdirSync(dir);
    let updatedList = [];
    files.forEach(function (file) {
        let panoDir = path.join(dir, file);
        if (fs.statSync(panoDir).isDirectory()) {
            let panoFile = findPanoXml(panoDir);
            if (panoFile) {
                let description = findDescriptionXml(panoDir)
                if (description) {
                    panoFile.meta = description
                }
                updatedList.push(panoFile);
            } else {
                updatePanoList(panoDir);
            }
        }
    });
    panos = updatedList.sort();
    //log(panos);
}

// ==================== watcher ====================
let changed = false;
chokidar.watch('.', {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
    changed = true;
});

setInterval(function () {
    if (changed) {
        changed = false;
        updatePanoList(panoRoot);
    }
}, 500);
