'use strict';

var options = require('config');
var logger = require('./logger/logger').logger;
var myPassportModel = require('my-passport-model');
var PassportSubscriptionResponseBuilder = myPassportModel.model.passportSubscriptionResponse.PassportSubscriptionResponseBuilder;
var Redis = require('./database/redis').Redis;
var redisClient = new Redis();

var fcm = require('./fcm');
var myPassportClient = require('my-passport-client');

var createCaseSubscription = function createCaseSubscription(caseNumber, token, options, callback) {
  logger.info('createCaseSubscription:', caseNumber, token);

  return redisClient.addSubscriber(caseNumber, token, function (err, res) {
    if (err) {
      logger.error('addSubscriber failed: ', err);
      return callback(err);
    }

    var response = new PassportSubscriptionResponseBuilder()
      .withSubscribed(true)
      .build();

    return callback(null, response);
  });

};

var startJobs = function startJobs() {
  logger.info('startJobs');

  var interval = setInterval(function () {
    redisClient.getNext(function (err, caseNumber) {
      if (err) {
        return logger.error('startJobs.getNext failed: ', err);
      }

      if (!caseNumber) {
        logger.info('startJobs.getNext empty');
      }

      logger.info('startJobs.getNext for: ', caseNumber);

      myPassportClient.checkCaseStatus(caseNumber, options, function (err, response) {
        if (err) {
          return logger.error('startJobs.getNext failed: ', err);
        }

        logger.info('startJobs.getNext: ', response);

        redisClient.getSubscriberTokens(caseNumber, function (err, tokens) {
          logger.info('startJobs.getSubscriberTokens: ', tokens);

          for (var index in tokens) {
            fcm.send(tokens[index], function (err, response) {
              if (err) {
                logger.error("Something has gone wrong!", err);
              } else {
                logger.info("Successfully sent with response: ", response);
              }
            });
          }
        });

      });
    });
  }, 1000 * 3600);
  // }, 3000);

  // clearInterval(interval);

};

module.exports = {
  createCaseSubscription: createCaseSubscription,
  startJobs: startJobs
};