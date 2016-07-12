'use strict';

var options = require('config');
var FCM = require('fcm-push-notif');
var logger = require('./../logger/logger').logger;
var serverKey = options.fcm.serverKey;

var Notification = function Notification() {
  var fcm = new FCM(serverKey);

  this.send = function send(token, callback) {
    logger.info('fcm.send: ', token);

    var message = {
      to: token,
      // collapse_key: 'your_collapse_key',
      // data: {
      //   your_custom_data_key: 'your_custom_data_value'
      // },
      notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
      }
    };

    fcm.send(message, callback);
  };
};


module.exports = {
  Notification: Notification
};