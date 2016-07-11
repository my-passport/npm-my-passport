'use strict';

var config = require('config');
var logger = require('./logger/logger').logger;
var myPassportModel = require('my-passport-model');
var PassportSubscriptionResponseBuilder = myPassportModel.model.passportSubscriptionResponse.PassportSubscriptionResponseBuilder;
var Redis = require('./database/redis').Redis;
var redisClient = new Redis();

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

module.exports = {
  createCaseSubscription: createCaseSubscription
};