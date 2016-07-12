'use strict';

var async = require('async');
var options = require('config');
var logger = require('./../logger/logger').logger;
var myPassportClient = require('my-passport-client');
var myPassportModel = require('my-passport-model');
var PassportSubscriptionResponseBuilder = myPassportModel.model.passportSubscriptionResponse.PassportSubscriptionResponseBuilder;
var StatusEnum = myPassportModel.enum.StatusEnum;
var Redis = require('./../database/redis').Redis;
var redisClient = new Redis();

var Notification = require('./notification').Notification;
var notification = new Notification();

var createCaseSubscription = function createCaseSubscription(caseNumber, token, callback) {
  logger.info('createCaseSubscription:', caseNumber, token);

  return myPassportClient.checkCaseStatus(caseNumber, options, function (errClient, caseResponse) {
    if (errClient) {
      logger.error('createCaseSubscription failed: ', errClient);
      return callback(errClient);
    }

    if (caseResponse.status === StatusEnum.READY) {
      logger.info('createCaseSubscription skipped because of status: ', caseResponse.status);

      return redisClient.removeFromProcessing(caseNumber, function (errRemoveFromProcessing/*, res*/) {
        if (errRemoveFromProcessing) {
          logger.error('startJobs.removeFromProcessing failed: ', errRemoveFromProcessing);
          return callback(errRemoveFromProcessing);
        }

        return redisClient.removeSubscriberTokens(caseNumber, function (errSubscriptionTokens/*, res*/) {
          if (errSubscriptionTokens) {
            logger.error('startJobs.removeSubscriberTokens failed: ', errSubscriptionTokens);
            return callback(errSubscriptionTokens);
          }

          return callback(null, new PassportSubscriptionResponseBuilder()
            .withSubscribed(false)
            .build());
        });
      });
    }

    return redisClient.addSubscriber(caseNumber, token, function (err/*, res*/) {
      if (err) {
        logger.error('addSubscriber failed: ', err);
        return callback(err);
      }

      return callback(null, new PassportSubscriptionResponseBuilder()
        .withSubscribed(true)
        .build());
    });
  });

};

var startJobs = function startJobs() {
  logger.info('startJobs');

  setInterval(function () {
    return redisClient.getNext(function (errNext, caseNumber) {
      if (errNext) {
        return logger.error('startJobs.getNext failed: ', errNext);
      }

      if (!caseNumber) {
        logger.info('startJobs.getNext empty');
        return;
      }

      logger.info('startJobs.getNext for: ', caseNumber);

      return myPassportClient.checkCaseStatus(caseNumber, options, function (errClient, response) {
        if (errClient) {
          return logger.error('startJobs.getNext failed: ', errClient);
        }

        if (response.status === StatusEnum.READY) {

          return redisClient.getSubscriberTokens(caseNumber, function (errSubscriptionTokens, tokens) {
            if (errSubscriptionTokens) {
              return logger.error('startJobs.getSubscriberTokens failed: ', errSubscriptionTokens);
            }

            logger.info('startJobs.getSubscriberTokens: ', tokens);

            return async.map(tokens, notification.send, function (err, fcmResponse) {
              if (err) {
                logger.error('Something has gone wrong!', err);
              } else {
                logger.info('Successfully sent with response:', fcmResponse);
              }
            });
          });
        }
        else {
          logger.info('startJobs.getNext skip for status: ', response.status);
          return false;
        }
      });
    });
    // }, 1000 * 3600);
  }, 3000);

  // clearInterval(interval);

};

module.exports = {
  createCaseSubscription: createCaseSubscription,
  startJobs: startJobs
};