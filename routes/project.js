var express = require('express');
var router = express.Router();

var EMPTY_ARRAY = [];

/* GET home page. */
router.get('/:projectId', function (req, res, next) {
    var project = req.params.projectId;
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
    console.log(JSON.stringify(req.session), (req.session.ids || EMPTY_ARRAY).indexOf(project), project);
    if (!projectObj.info.public && (req.session.ids || EMPTY_ARRAY).indexOf(project) === -1) {
        err = new Error('Permission denied');
        err.status = 400;
        return next(err);
    }
    res.render('project', {
        name: req.session.name || '',
        logged_in: !!req.session.logged_in,
        project: projectObj,
        token: !!global.token
    });
});

module.exports = router;
