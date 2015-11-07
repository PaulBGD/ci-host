var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    if (req.session.logged_in && req.session.admin) {
        res.render('admin', {
            name: req.session.name || '',
            admin: !!req.session.admin,
            logged_in: !!req.session.logged_in,
            token: !!global.token,
            tokens: tokenManager.tokens,
            projects: projectManager.getProjects(req.session.ids)
        });
    } else {
        res.redirect('/');
    }
});

router.post('/token/create', function (req, res) {
    if (req.session.logged_in && req.session.admin) {
        res.json(tokenManager.createToken());
    } else {
        res.json({error: true, message: 'No access'});
    }
});

router.post('/token/revoke', function (req, res) {
    if (req.session.logged_in && req.session.admin) {
        if (req.body.token) {
            tokenManager.removeToken(req.body.token);
            res.json({});
        } else {
            res.json({error: true, message: 'No token provided'});
        }
    } else {
        res.json({error: true, message: 'No access'});
    }
});

router.post('/token/toggle_project', function (req, res) {
    if (req.session.logged_in && req.session.admin) {
        if (req.body.token && req.body.project) {
            var contains = false;
            for (var i = 0, length = req.session.ids.length; i < length; i++) {
                if (req.session.ids[length] === req.body.projects) {
                    contains = true;
                    break;
                }
            }
            if (contains) {
                res.json(tokenManager.toggleProject(req.body.token, req.body.project));
            } else {
                res.json({error: true, message: 'You do not have access to add a key to that project'});
            }
        } else {
            res.json({error: true, message: 'No token or body provided'});
        }
    } else {
        res.json({error: true, message: 'No access'});
    }
});

module.exports = router;
