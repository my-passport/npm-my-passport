'use strict';

var options = require('config');
var FCM = require('fcm-push-notif');
var logger = require('./../logger/logger').logger;
var serverKey = options.fcm.serverKey;

var Notification = function Notification() {
  var fcm = new FCM(serverKey);

  this.sendCaseReadyNotification = function send(token, callback) {
    logger.info('Notification.sendCaseReadyNotification: ', token);

    var message = {
      to: token,
      collapse_key: 'my-passport-case-ready',
      // data: {
      //   your_custom_data_key: 'your_custom_data_value'
      // },
      notification: {
        title: 'Paszport gotowy do odbioru',
        body: 'Twój paszport jest już gotowy do odbioru.'
      }
    };

    fcm.send(message, callback);
  };
};


module.exports = {
  Notification: Notification
};