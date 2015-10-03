var fs = require('fs');
var path = require('path');
var dgram = require('dgram');
var yaml = require('js-yaml');
var debug = require('debug')('ci-host:Socket');
var config = require('../../config.json');
var Promise = require('bluebird');
var markdown = require('markdown');
var request = Promise.promisifyAll(require('request'));

var Project = require('../Project');
var JSONFile = require('../io/JSONFile');

function SocketServer() {
    this.resetData();
}

SocketServer.prototype.resetData = function () {
    this.connected = false;
    this.projectId = '';
    this.projectRef = '';
    this.extension = '';
    this.size = 0;
    this.buffers = [];
    this.lastData = Date.now();
};

SocketServer.prototype.handleData = function (data) {
    if (Date.now() - this.lastData > 10000) { // 10 second timeout
        this.resetData();
    }
    if (!this.connected) {
        var str = data.toString();
        if (str == config.server.key) {
            this.connected = true;
        }
    } else if (this.projectId == '') {
        str = data.toString();
        this.projectId = str;
        debug('Received projectId ' + this.projectId);
    } else if (this.projectRef == '') {
        str = data.toString();
        this.projectRef = str;
        debug('Received projectRef ' + this.projectRef);
    } else if (this.extension == '') {
        str = data.toString();
        this.extension = str;
        debug('Received extension ' + this.extension);
    } else if (this.size == 0) {
        str = data.toString();
        this.size = parseInt(str);
        debug('Received buffer amount ' + this.size);
    } else {
        // he's sending the file!
        this.buffers.push(data);
        debug('Received a buffer with length ' + data.length + ' for project ' + this.projectId);
        if (this.buffers.length < this.size) {
            return;
        }
        var buffer = Buffer.concat(this.buffers);
        var $this = this;
        var json;
        var project;
        request.getAsync(config.gitlab.url + '/api/v3/projects/' + encodeURIComponent(this.projectId) + '?private_token=' + global.token).spread(function (response, body) {
            if (response.statusCode !== 200) {
                $this.resetData();
                return debug('Invalid gitlab response', body);
            }
            json = JSON.parse(body);
            project = projectManager.getProject(json.id);

            if (project) {
                var file = path.join(project.directory, project.info.name + '_' + (project.info.builds.length + 1) + $this.extension);
                fs.writeFileSync(file, buffer);
                return [project, file];
            }
            var projectDir = path.join('projects', json.path_with_namespace.replace(/\\/g, '-').replace(/\//g, '-'));
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir);
            }
            file = path.join(projectDir, json.name + '_1' + $this.extension);
            fs.writeFileSync(file, buffer);

            project = new Project(projectDir, new JSONFile(path.join(projectDir, 'project.json'), {
                name: "unknown",
                url: 'http://unknown.com',
                id: -1,
                public: false,
                builds: []
            }));
            projectManager.projects.push(project);
            return [project, file];
        }).spread(function (project, file) {
            var projectRef = $this.projectRef;
            $this.resetData();
            // update data
            project.info.name = json.name;
            project.info.url = json.web_url;
            project.info.id = json.id;
            project.info.public = json.public;
            project.info.builds = project.info.builds || [];
            project.info.builds.push({date: Date.now(), id: file});
            project.info.write(); // save our new data
            debug('Saved as ' + file);
            console.log(config.gitlab.url + '/api/v3/projects/' + json.id + '/repository/files' +
                '?private_token=' + global.token +
                '&file_path=' + encodeURIComponent('.ci-deploy.yml') +
                '&ref=' + encodeURIComponent(projectRef));
            return request.getAsync(config.gitlab.url + '/api/v3/projects/' + json.id + '/repository/files' +
                '?private_token=' + global.token +
                '&file_path=' + encodeURIComponent('.ci-deploy.yml') +
                '&ref=' + encodeURIComponent(projectRef));
        }).spread(function (response, body) {
            if (response.statusCode !== 200) {
                return debug('Invalid gitlab response for retrieving .ci-deploy.yml', body);
            }
            var ciDeployRaw = JSON.parse(body).content;
            var ciDeploy = new Buffer(ciDeployRaw, 'base64').toString('utf8');
            var data = yaml.load(ciDeploy);
            if (data['ci-deploy'] && data['ci-deploy'].readme) {
                return request.getAsync(config.gitlab.url + '/api/v3/projects/' + json.id + '/repository/files' +
                    '?private_token=' + global.token +
                    '&file_path=' + encodeURIComponent(data['ci-deploy'].readme) +
                    '&ref=' + encodeURIComponent(projectRef))
                    .spread(function (response, body) {
                        if (response.statusCode !== 200) {
                            return debug('Invalid gitlab response for retrieving ' + data['ci-deploy'].readme, body);
                        }
                        var readmeRaw = JSON.parse(body).content;
                        var readme = new Buffer(readmeRaw, 'base64').toString('utf8');
                        project.info.readme = markdown.toHTML(readme); // convert to html
                        project.info.write();
                    });
            }
        }).catch(function (err) {
            $this.resetData();
            debug(err);
        });
    }
};

SocketServer.prototype.start = function () {
    var port = config.server.port;
    var server = dgram.createSocket('udp4');
    server.on('listening', function () {
        debug('Listening on port', port);
    });
    server.on('message', this.handleData.bind(this));
    server.bind(port);
};

module.exports = SocketServer;
