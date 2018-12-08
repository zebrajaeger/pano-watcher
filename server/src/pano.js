const fs = require('fs');
const path = require('path');
const xml2json = require('xml2json');

let pano = function (_options) {
    let options = {};

    if (_options) {
        for (let opt in _options) {
            if (!options.hasOwnProperty(opt)) {
                continue;
            }
            options[opt] = _options[opt];
        }
    }

    this.slugify = function (text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    this.findPanoXml = function findPanoXml(dir, relPath) {
        let files = fs.readdirSync(dir).sort();

        for (let index in  files) {
            let file = files[index];
            let x = path.join(dir, file);
            if (path.extname(file).toLowerCase() === '.xml') {
                let xml = fs.readFileSync(x);
                //console.log(x)
                let json = xml2json.toJson(xml, {object: true});
                if (json.krpano && json.krpano.preview && json.krpano.preview.url) {
                    return {
                        id: this.slugify(relPath),
                        name: path.basename(dir),
                        path: relPath,
                        panoFile: file,
                        preview: json.krpano.preview.url
                    }
                }
            }
        }
    };

    this.findDescriptionXml = function (dir) {
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
    };

    _findPanosInDirRecursive = function (dir, relPath, result) {
        let files = fs.readdirSync(dir);
        files.forEach(function (file) {
            let panoDir = path.join(dir, file);
            if (fs.statSync(panoDir).isDirectory()) {
                let newRelPath = relPath ? relPath + '/' + file : file;
                let panoFile = this.findPanoXml(panoDir, newRelPath);
                if (panoFile) {
                    let description = this.findDescriptionXml(panoDir);
                    if (description) {
                        panoFile.meta = description
                    }
                    result.push(panoFile);
                } else {
                    _findPanosInDirRecursive(panoDir, newRelPath, result);
                }
            }
        });
    };

    this.findPanosInDirRecursive = function (panoRoot) {
        result = [];
        _findPanosInDirRecursive(panoRoot, null, result);
        return result;
    };

    return this;
};

exports = module.exports = pano;