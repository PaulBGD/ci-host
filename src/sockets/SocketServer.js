var fs = require('fs');
var net = require('net');
var path = require('path');
var debug = require('debug')('ci-host:Socket');
var config = require('../../config.json');
var crypto = require('crypto');
var request = require('request');

var Project = require('../Project');
var JSONFile = require('../io/JSONFile');

function SocketServer() {
    this.resetData();
}

SocketServer.prototype.resetData = function () {
    this.connected = false;
    this.projectId = '';
    this.extension = '';
    this.lastData = Date.now();
};

SocketServer.prototype.handleData = function (data) {
    var str = data.toString();
    if (Date.now() - this.lastData > 10000) { // 10 second timeout
        this.resetData();
    }
    if (!this.connected) {
        if (str == config.server.key.substring(0, config.server.key.length / 2)) {
            this.connected = true;
        }
    } else if (this.projectId == '') {
        this.projectId = str;
        debug('Received projectId ' + this.projectId);
    } else if (this.extension == '') {
        this.extension = str;
        debug('Received extension ' + this.extension);
    } else {
        // he's sending the file!
        var buffer = data;
        debug('Received a buffer with length ' + buffer.length + ' for project ' + this.projectId);

        // we've got the file, time to decrypt it
        var salt = config.server.key.substring(config.server.key.length / 2, config.server.key.length);
        var cipher = crypto.createDecipher('aes-256-cbc', salt, salt);
        cipher.setAutoPadding(false);
        buffer = cipher.update(buffer);
        var $this = this;

        request(config.gitlab.url + '/api/v3/projects/' + encodeURIComponent(this.projectId) + '?private_token=' + global.token, function (err, response, body) {
            if (err) {
                $this.resetData();
                return debug(err);
            } else if (response.statusCode !== 200) {
                $this.resetData();
                return debug('Invalid gitlab response', body);
            }
            var json = JSON.parse(body);
            var project = projectManager.getProject(json.id);
            if (project) {
                var file = path.join(project.directory, project.info.name + '_' + (project.info.builds.length + 1) + $this.extension);
                fs.writeFileSync(file, buffer);
                project.info.builds.push({date: Date.now(), id: file});
                project.info.write();
                debug('Saved as ' + file);
                $this.resetData();
                return;
            }
            var projectDir = path.join('projects', json.path_with_namespace.replace(/\\/g, '-').replace(/\//g, '-'));
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir);
            }
            var projectInfo = new JSONFile(path.join(projectDir, 'project.json'), {
                name: "unknown",
                url: 'http://unknown.com',
                id: -1,
                public: false,
                builds: []
            });
            file = path.join(projectDir, json.name + '_1' + $this.extension);
            fs.writeFileSync(file, buffer);

            projectInfo.name = json.name;
            projectInfo.url = json.web_url;
            projectInfo.id = json.id;
            projectInfo.public = json.public;
            projectInfo.builds = [{date: Date.now(), id: file}];
            projectInfo.write();

            project = new Project(projectDir, projectInfo);
            projectManager.projects.push(project);
            debug('Saved as ' + file);
            $this.resetData();
        });
    }
};

SocketServer.prototype.start = function () {
    var port = config.server.port;
    var server = dgram.createSocket('udp4');
    server.on('listening', function () {
        debug('Listening on port', port);
    });
    server.on('message', this.handleData);
    server.bind(port);
};

module.exports = SocketServer;
