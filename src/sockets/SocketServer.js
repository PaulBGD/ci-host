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

}

SocketServer.prototype.onConnection = function (socket) {
    debug('Received socket connection..');

    var connected = false;
    var projectId = -1;
    var extension = '';

    socket.on('data', function (data) {
        if (!connected) {
            if (data.toString('utf8') == config.server.key.substring(0, config.server.key.length / 2)) {
                connected = true;
            } else {
                socket.end();
            }
        } else if (projectId == -1) {
            projectId = parseInt(data.toString('utf8'));
        } else if (extension == '') {
            extension = data.toString('utf8');
        } else {
            // he's sending the file!
            var buffer = data;
            if (buffer.length == 0) {
                return console.error('Received invalid file');
            }
            debug('Received a file with length ' + buffer.length + ' for project ' + projectId);

            // we've got the file, time to decrypt it
            var salt = config.server.key.substring(config.server.key.length / 2, config.server.key.length);
            var cipher = crypto.createDecipher('aes-256-cbc', salt, salt);
            cipher.setAutoPadding(false);
            buffer = cipher.update(buffer);

            var project = projectManager.getProject(projectId);
            if (project == null) {
                // this is the first deploy
                request(config.gitlab.url + '/api/v3/projects/' + projectId + '?private_token=' + global.token, function (err, response, body) {
                    if (err) {
                        return debug(err);
                    } else if (response.statusCode !== 200) {
                        return debug('Invalid gitlab response', body);
                    }
                    var json = JSON.parse(body);
                    var projectDir = path.join('projects', json.path_with_namespace.replace(/\\/g, '-').replace(/\//g, '-'));
                    fs.mkdirSync(projectDir);
                    var projectInfo = new JSONFile(path.join(projectDir, 'project.json'), {
                        name: "unknown",
                        url: 'http://unknown.com',
                        id: -1,
                        public: false,
                        builds: []
                    });
                    var file = path.join(projectDir, json.name + '_1' + extension);
                    fs.writeFileSync(file, buffer);

                    projectInfo.name = json.name;
                    projectInfo.url = json.web_url;
                    projectInfo.id = json.id;
                    projectInfo.public = json.public;
                    projectInfo.builds = [{date: Date.now(), id: file}];
                    projectInfo.write();

                    var project = new Project(projectDir, projectInfo);
                    projectManager.projects.push(project);
                    debug('Saved as ' + file);
                });
            } else {
                var file = path.join(project.directory, project.info.name + '_' + (project.info.builds.length + 1) + extension);
                fs.writeFileSync(file, buffer);
                project.info.builds.push({date: Date.now(), id: file});
                project.info.write();
                debug('Saved as ' + file);
            }
        }
    });

    socket.on('error', function (err) {
        debug(err);
        try {
            socket.close();
        } catch (e) {}
    });
};

SocketServer.prototype.start = function () {
    var port = config.server.port;
    net.createServer(this.onConnection).listen(port);
    debug('Listening on port', port);
};

module.exports = SocketServer;
