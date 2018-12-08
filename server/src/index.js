// node includes
const fs = require('fs');
const path = require('path');

// 3rd party includes
const express = require('express');

// project includes
const pano = require('./pano')();
const preview = require('./preview')();

// config
const workingDirectory = path.join(__dirname, '..');
const c = require('../config.json');
const port = c.port || 3000;
const updateInterval = (c.updateInterval) ? c.updateInterval : 1000;
let previewSizes = c.previewSizes || [100, 150, 200, 250, 300];

// global variables
let panos = [];
let changed = false;
const app = express();

// ==================== http Server ====================

// static stuff
app.use('/static/panos', express.static(c.panoRoot));
app.use('/', express.static('../client/build/'));

// api
app.get('/api/krpano/', handleKrPano);
app.get('/api/reload/', handleReload);
app.get('/api/panos/', handlePanos);
app.get('/api/panos/:id', handlePano);
app.get('/api/panos/:id/preview', handlePreviewWithoutSize);
app.get('/api/panos/:id/preview/:size', handlePreviewWithSize);
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

    let path = path.join(workingDirectory, 'krpano.js');
    response.sendFile(path, options, function (err) {
        if (err) {
            next(err);
        }
    });
}

function handleReload(request, response) {
    changed = true;
    response.status(200).end();
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

function handlePreview(request, response, next, id, size) {
    let options = {
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    let pano = findPano(id);
    if (pano == null || !pano.preview) {
        response.status(404).send(`Pano with id: '${id}' not found`);
        return;
    }

    let originalPath = path.join(workingDirectory, c.panoRoot, pano.path, pano.preview);
    if (!fs.existsSync(originalPath)) {
        response.status(404).send('Original preview not found');
        return;
    }

    let targetPath = path.join(workingDirectory, c.panoRoot, pano.path);
    let previewPath = preview.get(targetPath, size);

    if (previewPath) {
        response.sendFile(previewPath, options, function (err) {
            if (err) {
                next(err);
            }
        });
    } else {
        response.status(404).send('Scaled preview not (maybe yet) found');
    }
}

function handlePreviewWithoutSize(request, response, next) {
    let id = request.params.id;
    handlePreview(request, response, next, id, 200);
}

function handlePreviewWithSize(request, response, next) {
    let id = request.params.id;
    let size = request.params.size;

    size = getPreviewSizeForSize(size);

    handlePreview(request, response, next, id, size);
}

// ==================== pano and dir parser ====================
function findPano(id) {
    let result = null;
    panos.forEach(p => {
        if (p.id === id) {
            result = p;
        }
    });
    return result;
}

function updatePanoList() {
    let updatedList = pano.findPanosInDirRecursive(c.panoRoot);
    panos = updatedList.sort();
    previewTask();
    console.log("===== UPDATE =====");
    panos.forEach((p, index) => console.log(index, p.id, p.path, p.name));
}

// ==================== Preview Generator Task ====================
let previewTasks = [];

function getPreviewSizeForSize(size) {
    for (const previewSize of previewSizes) {
        if (previewSize >= size) {
            return previewSize;
        }
    }
    return previewSizes[previewSizes.length - 1];
}

function clearPreviewTask() {
    previewTasks.forEach(function (immediate) {
        clearImmediate(immediate);
    })
}

function previewTask() {
    clearPreviewTask();

    panos.forEach(function (pano) {
        let immediate = setImmediate(function () {
            let originalPath = path.join(workingDirectory, c.panoRoot, pano.path, pano.preview);
            let targetlPath = path.join(workingDirectory, c.panoRoot, pano.path);
            preview.create(originalPath, targetlPath, previewSizes)
        });
        previewTasks.push(immediate);
    });
}

// ==================== watcher ====================
setInterval(function () {
    if (changed) {
        changed = false;
        updatePanoList();
    }
}, updateInterval);

updatePanoList();