var fs = require('fs');
var path = require('path');
var async = require('async');
var express = require('express');
var request = require('request');
var oauth2 = require('simple-oauth2');
var router = express.Router();

var config = require('../config.json');
var gitlab = oauth2({
    clientID: config.gitlab.app_id,
    clientSecret: config.gitlab.secret,
    site: config.gitlab.url,
    tokenPath: '/oauth/token'
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('/auth/gitlab');
});

router.get('/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
});

router.get('/gitlab', function (req, res, next) {
    var now = Date.now();
    if (req.session.lastLogin && now - req.session.lastLogin < 2000) {
        var err = new Error('Attempting to log in too fast');
        err.status = 400;
        return next(err);
    }
    req.session.lastLogin = now;
    res.redirect(gitlab.authCode.authorizeURL({
        redirect_uri: config.data.url + '/auth/gitlab/callback'
    }));
});

router.get('/gitlab/callback', function (req, res, next) {
    var code = req.query.code;
    if (!code) {
        return res.redirect('/');
    }
    async.waterfall([
        function (callback) {
            gitlab.authCode.getToken({
                code: code,
                redirect_uri: config.data.url + '/auth/gitlab/callback'
            }, callback);
        },
        function (results, callback) {
            request(config.gitlab.url + '/api/v3/user?access_token=' + results.access_token, callback);
        },
        function (response, body, callback) {
            if (response.statusCode !== 200) {
                var error = new Error('Gitlab Error');
                error.status = response.statusCode || 500;
                return next(error);
            }
            var json = JSON.parse(body);
            var token = json.private_token;
            if (json.is_admin && !global.token) {
                global.token = token;
                config.token = token;
                fs.writeFileSync('config.json', JSON.stringify(config, null, 3));
                console.log("wrote", JSON.stringify(config));
            }
            req.session.token = token;
            if (!token) {
                error = new Error('Missing Token');
                error.status = 500;
                return next(error);
            }
            var id = json.id;
            var tasks = [];

            projectManager.projects.forEach(function (project) {
                tasks.push(function(callback) {
                    async.waterfall([
                        function (callback) {
                            request(config.gitlab.url + '/api/v3/projects/' + project.info.id + '/members?private_token=' + token, callback);
                        },
                        function (response, body, nextCallback) {
                            if (response.statusCode !== 200) {
                                var error = new Error('Gitlab Error');
                                error.status = response.statusCode || 500;
                                return next(error);
                            }
                            var json = JSON.parse(body);
                            var length = json.length;
                            while (length--) {
                                if (json[length].id == id) {
                                    return callback(null, project.info.id);
                                }
                            }
                            // try checking the namespace
                            request(config.gitlab.url + '/api/v3/projects/' + project.info.id + '?private_token=' + token, nextCallback);
                        },
                        function (response, body, nextCallback) {
                            if (response.statusCode !== 200) {
                                var error = new Error('Gitlab Error');
                                error.status = response.statusCode || 500;
                                return next(error);
                            }
                            var json = JSON.parse(body);
                            if (json.public) {
                                return callback(null, project.info.id);
                            }
                            var accessLevel = json.permissions.group_access.access_level;
                            request(config.gitlab.url + '/api/v3/groups/' + json.namespace.id + '/members?private_token=' + token, function (err, response, body) {
                                nextCallback(err, accessLevel, response, body);
                            });
                        },
                        function (accessLevel, response, body, callback) {
                            if (response.statusCode !== 200) {
                                // group doesn't exist
                                return callback();
                            }
                            var json = JSON.parse(body);
                            var length = json.length;
                            while(length--) {
                                var user = json[length];
                                if (user.id == id && user.access_level >= accessLevel) {
                                    return callback(null, project.info.id);
                                }
                            }
                            callback();
                        }
                    ], callback);
                });
            });

            async.parallel(tasks, function (err, ids) {
                if (err) {
                    return callback(err);
                }
                ids = ids.filter(function(id) {
                    return id != null
                });
                req.session.name = json.name;
                req.session.ids = ids || [];
                req.session.logged_in = true;
                callback();
            });
        }
    ], function (err) {
        if (err) {
            return next();
        }
        res.redirect('/')
    });
});

module.exports = router;
