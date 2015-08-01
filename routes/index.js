var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    var projects = projectManager.getProjects(req.session.ids);
    if (projects.length > 0 || req.session.logged_in) {
        res.render('index', {
            name: req.session.name || '',
            logged_in: !!req.session.logged_in,
            projects: projects,
            token: !!global.token
        });
    } else {
        res.render('log_in', {logged_in: false});
    }
});

module.exports = router;
