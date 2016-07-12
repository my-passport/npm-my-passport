'use strict';

var async = require('async');
var options = require('config');
var util = require('util');
var redis = require('redis');
var logger = require('../logger/logger').logger;
var uniqueCasesName = 'unique_cases';
var processingQueueName = 'cases_queue';
var caseSubscriptionFormat = '%s_case_subscription';

var Redis = function Redis() {
  var client = redis.createClient(options.redis);
  client.on('error', function (err) {
    logger.error('Redis error: ', err);
  });

  this.getSubscriberTokens = function getSubscriberTokens(caseNumber, callback) {
    var caseSubscriptionName = util.format(caseSubscriptionFormat, caseNumber);

    return client.smembers(caseSubscriptionName, function (err, res) {
      if (err) {
        logger.error('getSubscriberTokens error: ', err);
      }

      return callback(err, res);
    });
  };

  this.removeSubscriberTokens = function removeSubscriberTokens(caseNumber, callback) {
    var caseSubscriptionName = util.format(caseSubscriptionFormat, caseNumber);

    client.multi([
      ['srem', uniqueCasesName, caseNumber],
      ['del', caseSubscriptionName]
    ]).exec(function (err, replies) {
      if (err) {
        logger.error('redis.removeSubscriberTokens error: ', err);
        return callback(err);
      }

      logger.info('removeSubscriberTokens multi ok: ', replies);
      return callback(null, replies);
    });
  };

  this.removeFromProcessing = function removeFromProcessing(caseNumber, callback) {
    return client.lrange(processingQueueName, 0, -1, function (err, cases) {
      if (err) {
        logger.error('removeSubscriberTokens cases error: ', err);
        return callback(err);
      }

      return client.lrem(processingQueueName, 0, caseNumber, function (err, removeResult) {
        if (err) {
          logger.error('removeFromProcessing cases error: ', err);
        }

        return callback(err, removeResult);
      });
    });
  };

  this.getNext = function getNext(callback) {
    return client.rpoplpush(processingQueueName, processingQueueName, function (err, res) {
      if (err) {
        logger.error('getNext error: ', err);
      }
      return callback(err, res);
    });
  };

  this.addSubscriber = function addSubscriber(caseNumber, token, callback) {
    var caseSubscriptionName = util.format(caseSubscriptionFormat, caseNumber);

    client.multi([
      ['sadd', uniqueCasesName, caseNumber],
      ['sadd', caseSubscriptionName, token]
    ]).exec(function (err, replies) {
      if (err) {
        logger.error('redis.addSubscriber error: ', err);
        return callback(err);
      }

      logger.info('addSubscriber multi ok: ', replies);

      if (replies[0] === 1) {
        logger.info('addSubscriber add: "%s" to processing queue', caseNumber);
        return client.lpush(processingQueueName, caseNumber, callback);
      }

      return callback(null, replies);
    });
  };

};

module.exports = {
  Redis: Redis
};