var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var tropoWebapi = require('tropo-webapi');

var TROPO_PORT = 8080;
var VOICE_TOKEN = 'your_voice_token';
var NUMBER_TO_CALL = 'number_to_call';
var TROPO_SESSION_API = 'api.tropo.com';

function createHttpServer() {
  var httpApp = express();

  httpApp.use(bodyParser.json());
  httpApp.use(bodyParser.urlencoded({ extended: false }));

  httpApp.get('/', function(req, res, next) {
    res.send({message: ''});
  });

  // --- TROPO ROUTES ----------
  // voice
  httpApp.use('/voice', function(req, res, next) {
    var tropo = new tropoWebapi.TropoWebAPI();
    tropo.call('+' + NUMBER_TO_CALL); // Number to call
    var msg = req.body.session.parameters.msg;
    tropo.say(msg, null, null, null, null, 'audrey');

    res.send(tropoWebapi.TropoJSON(tropo));
  });

  // text
  httpApp.use('/text', function(req, res, next) {
    var tropo = new tropoWebapi.TropoWebAPI();

    if (req.body.session.initialText && req.body.session.initialText == 'Yes') {
      // Sending sms
      tropo.say('Call ongoing...');
      // Launch a call
      tropo.on('continue', null, '/smsToCall', true);
    }
    else if (req.body.session.initialText || req.body.session.initialText != 'No') {
      tropo.call(
        '+' + req.body.session.parameters.numberToDial,
        false,
        null,
        null,
        null,
        null,
        'SMS'
      );
      tropo.say(req.body.session.parameters.msg);
    }

    res.send(tropoWebapi.TropoJSON(tropo));
  });

  httpApp.use('/smsToCall', function(req, res, next) {
    var info = encodeURIComponent('hello world');
    var path = '/1.0/sessions?action=create&token=' + VOICE_TOKEN + '&msg=' + info;

    var request = http.request({
      port: 80,
      hostname: TROPO_SESSION_API,
      method: 'GET',
      path: path
    });
    request.end();
    res.end();
  });

  return httpApp;
}

var httpServer = createHttpServer();

httpServer.listen(TROPO_PORT, function() {
  console.log('TROPO listening on port ' + TROPO_PORT + '...');
});
