const express = require('express');
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const xml2json = require('xml2json');
const jimp = require('jimp');

const c = require('./config.json');

const port = c.port || 3000;
const previewSize = (c.preview && c.preview.size)
    ? c.preview.size
    : 256;
const previewQuality = (c.preview && c.preview.quality)
    ? c.preview.quality
    : 90;
const updateInterval = (c.updateInterval)
    ? c.updateInterval
    : 10000;

let panos = [];
let changed = false;

// ==================== helpers ====================
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// ==================== http Server ====================
const app = express();

// static stuff
app.use('/static/panos', express.static(c.panoRoot));
app.use('/', express.static('../client/build/'));

app.get('/api/krpano/', handleKrPano);
app.get('/api/reload/', handleReload);
// api
app.get('/api/panos/', handlePanos);
app.get('/api/panos/:id', handlePano);
app.get('/api/panos/:id/preview', handlePreview);
app.get('/api/panos/:id/meta', handleMeta);

app.listen(port, () => console.log('Listening on port ' + port));

function handleKrPano(request, response, next) {
    if (!fs.existsSync('krpano.js')) {
        response.status(404).send('krpano not found');
        return;
    }

    let options = {
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    let path = __dirname + '/krpano.js';
    response.sendFile(path, options, function (err) {
        if (err) {
            next(err);
        }
    });
}

function handleReload(request, response, next) {
    changed = true;
}

function handlePanos(request, response) {
    response.json(panos);
}

function handlePano(request, response) {
    let id = request.params.id;
    let pano = findPano(id);
    if (pano == null) {
        response.status(404).send(`Pano with id: '${id}' not found`);
    } else {
        response.json(pano);
    }
}

function handleMeta(request, response) {
    let id = request.params.id;
    let pano = findPano(id);
    if (pano == null) {
        response.status(404).send(`Pano with id: '${id}' not found`);
    } else if (!pano.meta) {
        response.status(404).send(`Meta for pano with id: '${id}' not found`);
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

    let pathOriginal = c.panoRoot + `/${pano.path}/${pano.preview}`;
    let pathScaled = pathOriginal + `_preview(${previewSize}x${previewSize}).png`;

    if (!fs.existsSync(pathOriginal)) {
        response.status(404).send('Preview not found');
        return;
    }

    if (!fs.existsSync(pathScaled)) {
        jimp.read(pathOriginal)
            .then(img => {
                return img
                    .scaleToFit(previewSize, previewSize)
                    .quality(previewQuality)
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
}

// ==================== pano and dir parser ====================
function findPano(id) {
    let result = null;
    panos.forEach(pano => {
        if (pano.id === id) {
            result = pano;
        }
    });
    return result;
}

function findPanoXml(dir, relPath) {
    let files = fs.readdirSync(dir).sort();

    for (let index in  files) {
        let file = files[index];
        let x = path.join(dir, file);
        if (path.extname(file).toLowerCase() === '.xml') {
            let xml = fs.readFileSync(x);
            let json = xml2json.toJson(xml, {object: true});
            if (json.krpano && json.krpano.preview && json.krpano.preview.url) {
                return {
                    id: slugify(relPath),
                    name: path.basename(dir),
                    path: relPath,
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
                    text: json.description.text,
                    tags: json.description.tags.tag
                }
            }
        }
    }
}

/**
 * scan directories recursive
 * @param dir
 */
let updatedList;

function _updatePanoList(dir, relPath) {
    let files = fs.readdirSync(dir);
    files.forEach(function (file) {
        let panoDir = path.join(dir, file);
        if (fs.statSync(panoDir).isDirectory()) {
            let newRelPath = relPath ? relPath + '/' + file : file;
            let panoFile = findPanoXml(panoDir, newRelPath);
            if (panoFile) {
                let description = findDescriptionXml(panoDir);
                if (description) {
                    panoFile.meta = description
                }
                updatedList.push(panoFile);
            } else {
                _updatePanoList(panoDir, newRelPath);
            }
        }
    });
}

function updatePanoList() {
    updatedList = [];
    _updatePanoList(c.panoRoot, null);
    panos = updatedList.sort();

    console.log("===== UPDATE =====");
    panos.forEach((pano, index) => console.log(index, pano.id, pano.path, pano.name));
}

// ==================== watcher ====================

setInterval(function () {
    if (changed) {
        changed = false;
        updatePanoList();
    }
}, updateInterval);

updatePanoList();

chokidar.watch(c.panoRoot, {ignored: /(^|[\/\\])\../}).on('all', () => {
    changed = true;
});
