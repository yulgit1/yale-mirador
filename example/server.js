var fs = require('fs');
var express = require('express');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');

var app = express();

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
console.log('manifest: ' + config.manifestUrl);
console.log('endpoint: ' + config.apiSettings.endpointUrl);

app.use(cookieParser());
app.use(serveStatic('../'));

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', function(req, res) {
  res.cookie('isEditor', config.isEditor);
  res.render('index', { manifestUrl: config.manifestUrl }); // serve index.pug
});

app.get('/api/settings', function(req, res) {
  var obj = config.apiSettings;
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(obj));
});

app.get('/favicon.ico', function(req, res) {
  res.redirect('/example/favicon.ico');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
