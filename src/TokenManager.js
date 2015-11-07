var JSONFile = require('./io/JSONFile');
var path = require('path');
var crypto = require('crypto');

var TokenManager = module.exports = function TokenManager() {
    this.tokenFile = new JSONFile(path.join(process.cwd(), 'tokens.json'), {tokens: []});
    this.tokenFile.read();
    this.tokenFile.write();
    this.tokens = Token.getTokens(this.tokenFile);
};

TokenManager.prototype.createToken = function() {
    var token = new Token(crypto.randomBytes(16).toString('hex'), {});
    this.tokens.push(token);
    this.tokenFile.tokens.push(token);
    this.tokenFile.write();
    return token;
};

TokenManager.prototype.getToken = function (token) {
    var length = this.tokens.length;
    while (length--) {
        if (this.tokens[length].token == token) {
            return this.tokens[length];
        }
    }
};

TokenManager.prototype.removeToken = function (token) {
    var length = this.tokens.length;
    while (length--) {
        if (this.tokens[length].token == token) {
            this.tokens.splice(length, 1);
        }
    }
    length = this.tokenFile.tokens.length;
    while (length--) {
        if (this.tokenFile.tokens[length].token == token) {
            this.tokenFile.tokens.splice(length, 1);
        }
    }
    this.tokenFile.write();
};

TokenManager.prototype.toggleProject = function(token, project) {
    var name = projectManager.getProject(project).info.name;
    var tokenObject;
    var length = this.tokens.length;
    while (length--) {
        if (this.tokens[length].token == token) {
            tokenObject = this.tokens[length];
            if (tokenObject.projects[name]) {
                delete tokenObject.projects[name];
            } else {
                tokenObject.projects[name] = project;
            }
            break;
        }
    }
    this.tokenFile.write();
    return tokenObject;
};

function Token(token, projects) {
    this.token = token;
    this.projects = projects;
}

Token.getTokens = function (tokenFile) {
    if (!tokenFile.tokens) {
        return [];
    }
    return tokenFile.tokens.map(function (token) {
        return new Token(token.token, token.projects);
    })
};

Token.prototype.getProjectIds = function () {
    var self = this;
    return Object.keys(this.projects).map(function (key) {
        return self.projects[key];
    });
};

Token.prototype.getProjectNames = function () {
    return Object.keys(this.projects);
};

Token.prototype.belongsToProject = function (project) {
    return project && project.info && this.projects[project.info.name];
};
