var debug = require('debug')('ci-host:IO');
var fs = require('fs');

function JSONFile(file, defaults) {
    Object.defineProperties(this, {
        _file: {
            value: file
        },
        _defaults: {
            value: defaults
        }
    });
}

JSONFile.prototype.read = function() {
    var json = {};
    if (fs.existsSync(this._file)) {
        var data = fs.readFileSync(this._file, 'utf8').toString();
        try {
            json = JSON.parse(data);
        } catch(e) {
            debug(e);
        }
    }

    for (var property in this._defaults) {
        if (this._defaults.hasOwnProperty(property)) {
            if (json.hasOwnProperty(property)) {
                this[property] = json[property];
            } else {
                this[property] = this._defaults[property];
            }
        }
    }
};

JSONFile.prototype.write = function() {
    var json = {};
    for (var property in this._defaults) {
        if (this.hasOwnProperty(property)) {
            json[property] = this[property];
        } else {
            json[property] = this._defaults[property];
        }
    }
    var data = JSON.stringify(json, null, 3);
    fs.writeFileSync(this._file, data);
};

module.exports = JSONFile;
