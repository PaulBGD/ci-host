var path = require('path');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/*/*', function (req, res, next) {
    if (req.session.logged_in) {
        var split = req.url.substr(1).split('/');
        var project = parseInt(split[0]);
        var build = parseInt(split[1]);
        if (isNaN(project) || isNaN(build)) {
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
        if (req.session.ids.indexOf(project) === -1 && !projectObj.info.public) {
            err = new Error('Permission denied');
            err.status = 400;
            return next(err);
        }
        if (build < 0 || projectObj.info.builds.length <= build) {
            err = new Error('Build does not exist');
            err.status = 400;
            return next(err);
        }
        res.download(projectObj.info.builds[build].id);
    } else {
        res.render('log_in', {logged_in: false});
    }
});

module.exports = router;
