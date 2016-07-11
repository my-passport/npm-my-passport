var FCM = require('fcm-node');
var logger = require('./logger/logger').logger;
var serverKey = 'AIzaSyAbN4xV_LexWnMUzoynQJ8Ci-BDgxn-6WA';
var fcm = new FCM(serverKey);

var send = function send(token, callback) {
  logger.info('fcm.send: ', token);

  var message = {
    to: token,
    collapse_key: 'your_collapse_key',
    data: {
      your_custom_data_key: 'your_custom_data_value'
    },
    notification: {
      title: 'Title of your push notification',
      body: 'Body of your push notification',
      icon: 'ic_launcher' //now required
    }
  };

  fcm.send(message, callback);
};


module.exports = {
  send: send
};