var express = require('express');
var router = express.Router();

var EMPTY_ARRAY = [];

/* GET home page. */
router.get('/:projectId', function (req, res, next) {
    var project = req.params.projectId;
    if (typeof project == 'string') {
        project = parseInt(project);
    }
    if (isNaN(project)) {
        var err = new Error('Invalid parameters');
        err.status = 400;
        return next(err);
    }
    var projectObj = projectManager.getProject(project);
    if (!projectObj) {
        err = new Error('Project does not exist');
        err.status = 400;
        return next(err);
    }
    var permitted = false;
    if (req.query.auth_token) {
        var token = tokenManager.getToken(req.query.auth_token);
        permitted = token && token.belongsToProject(projectObj);
    } else {
        permitted = (req.session.ids || EMPTY_ARRAY).indexOf(project) !== -1 || projectObj.info.public;
    }
    if (!permitted) {
        err = new Error('Permission denied');
        err.status = 400;
        return next(err);
    }
    res.render('project', {
        name: req.session.name || '',
        admin: !!req.session.admin,
        logged_in: !!req.session.logged_in,
        project: projectObj,
        token: !!global.token,
        auth: req.query.auth_token ? '?auth_token=' + req.query.auth_token : ''
    });
});

module.exports = router;
