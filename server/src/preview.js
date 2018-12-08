const fs = require('fs');
const path = require('path');
const jimp = require('jimp');

let preview = function (_options) {
    this.options = {
        previewQuality: 90,
        previewFileName: '_preview',
        previewFileExtension: 'png'
    };

    if (_options) {
        for (let opt in _options) {
            if (!this.options.hasOwnProperty(opt)) {
                continue;
            }
            this.options[opt] = _options[opt];
        }
    }

    this.getScaledPath = function (targetPath, size) {
        return path.join(targetPath, `${this.options.previewFileName}(${size}x${size}).${this.options.previewFileExtension}`);
    };

    this.get = function (targetPath, size, defaultPath) {
        let scaledPath = this.getScaledPath(targetPath, size);
        return fs.existsSync(scaledPath) ? scaledPath : defaultPath;
    };

    this.create = function (originalPath, targetPath, sizes) {
        if (!Array.isArray(sizes)) {
            sizes = [sizes];
        }

        sizes.forEach(function (size) {
            let scaledPath = this.getScaledPath(targetPath, size);

            if (!fs.existsSync(scaledPath)) {
                // TODO this is async, isn't it? If yes, we occupy all threads in node threadpool!!
                jimp.read(originalPath)
                    .then(img => {
                        let result =  img
                            .scaleToFit(size, size)
                            .quality(this.options.previewQuality)
                            .write(scaledPath);
                        console.log("preview created: " + scaledPath);
                        return result;
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        });
    };

    return this;
};

exports = module.exports = preview;