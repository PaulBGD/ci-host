var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var clientSessions = require('client-sessions');

if (!fs.existsSync('config.json')) {
    fs.writeFileSync('config.json', JSON.stringify({
        data: {
            url: 'http://localhost:3000'
        },
        server: {
            port: 8084,
            key: 'unset',
            gitlab: {
                url: 'http://your-gitlab-instance.com',
                app_id: 'unset',
                secret: 'unset'
            }
        }
    }));
}

global.projectManager = new (require('./src/ProjectManager'))();
global.socketServer = new (require('./src/sockets/SocketServer'))();
global.token = require('./config.json').token;

var routes = require('./routes/index');
var auth = require('./routes/auth');
var downloads = require('./routes/downloads');
var project = require('./routes/project');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(clientSessions({
    cookieName: 'session',
    // todo gen key
    secret: 'adadaddg5redrajkdrtyab6353a525d253525234sdfmlsamflkfsm flkmsdlfmlsdfmldsfmlfksdmlkdfsmlfdsmddadhiljiojmkmladw12313ojdamdowajdnawjdioawjdoijm1m3o12i3j123io1j23oijmcaoicajdiowjaim4om4m2kwadwadwad644madw',
    duration: 30 * 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
}));

app.use('/', routes);
app.use('/auth', auth);
app.use('/downloads', downloads);
app.use('/project', project);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message || 'Unknown error',
            status: err.status || 500,
            stack: err.stack || '',
            logged_in: false
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message || 'Unknown error',
        status: err.status || 500,
        stack: '',
        logged_in: false
    });
});

socketServer.start();

module.exports = app;
