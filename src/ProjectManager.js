var fs = require('fs');
var path = require('path');

var JSONFile = require('./io/JSONFile');
var Project = require('./Project');

function ProjectManager() {
    console.log('Loading Projects..');
    if (fs.existsSync('projects')) {
        if (fs.statSync('projects').isDirectory()) {
            var projects = fs.readdirSync('projects');
            var length = projects.length;
            while (length--) {
                var projectDir = path.join('projects', projects[length]);
                var projectInfo = new JSONFile(path.join(projectDir, 'project.json'), {
                    name: "unknown",
                    url: 'http://unknown.com',
                    id: -1,
                    public: false,
                    builds: [],
                    readme: null
                });
                projectInfo.read();

                if (projectInfo.id == -1) {
                    console.error('Project directory ' + projectDir + ' is missing a project.json!');
                    continue;
                }

                this.projects.push(new Project(projectDir, projectInfo));
            }
        } else {
            console.error('File projects should be a directory!');
        }
    } else {
        fs.mkdirSync('projects');
    }
    console.log('Loaded ' + this.projects.length + ' Projects');
}

ProjectManager.prototype.projects = [];

ProjectManager.prototype.addProject = function (project) {
    this.projects.push(project);
};

ProjectManager.prototype.getProject = function (id) {
    var length = this.projects.length;
    while (length--) {
        var project = this.projects[length];
        if (project.info.id == id) {
            return project;
        }
    }
    return null;
};

ProjectManager.prototype.getProjects = function (ids) {
    ids = ids || [];
    var returning = [];
    var projectLength = this.projects.length;
    while (projectLength--) {
        var project = this.projects[projectLength];
        if (project.info.public || ids.indexOf(project.info.id) > -1) {
            returning.push(project);
        }
    }
    return returning;
};

module.exports = ProjectManager;
