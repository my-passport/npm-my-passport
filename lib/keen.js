'use strict';

var Keen = require('keen-js');
var config = require('config');
var extend = require('util')._extend;
var logger = require('./logger/logger').logger;

var client = new Keen(config.keen);

var errorCase = function errorCase(auth, searchRequest, err) {
  logger.debug('save errorCase:', err);

  var event = extend(
    {
      keen: {
        timestamp: new Date().toISOString()
      },
      searchRequest: searchRequest,
      auth: auth
    }, err);

  client.addEvent('errorCase', event, function (errEvent) {
    if (errEvent) {
      logger.warn('errorCase save err:', errEvent);
    }
  });
};

var errorCaseSubscription = function errorCaseSubscription(auth, subscriptionData, err) {
  logger.debug('save errorCaseSubscription:', err);

  var event = extend(
    {
      keen: {
        timestamp: new Date().toISOString()
      },
      subscriptionData: subscriptionData,
      auth: auth
    }, err);

  client.addEvent('errorCaseSubscription', event, function (errEvent) {
    if (errEvent) {
      logger.warn('errorCaseSubscription save err:', errEvent);
    }
  });
};

var errorNews = function errorNews(action, auth, params, err) {
  logger.debug('save errorNews:', err);

  var event = extend(
    {
      keen: {
        timestamp: new Date().toISOString()
      },
      action: action,
      params: params,
      auth: auth
    }, err);

  client.addEvent('errorNews', event, function (errEvent) {
    if (errEvent) {
      logger.warn('errorNews save err:', errEvent);
    }
  });
};

var checkCase = function checkCase(auth, searchRequest) {
  logger.debug('save checkCase:', searchRequest);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    searchRequest: searchRequest,
    auth: auth
  };

  client.addEvent('checkCase', event, function (errEvent) {
    if (errEvent) {
      logger.warn('checkCase save err:', errEvent);
    }
  });
};

var checkCaseSubscription = function checkCaseSubscription(auth, subscriptionData) {
  logger.debug('save checkCaseSubscription:', subscriptionData);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    subscriptionData: subscriptionData,
    auth: auth
  };

  client.addEvent('checkCaseSubscription', event, function (errEvent) {
    if (errEvent) {
      logger.warn('checkCaseSubscription save err:', errEvent);
    }
  });
};

var newsSearch = function newsSearch(auth, searchRequest) {
  logger.debug('save newsSearch:', searchRequest);

  var event = {
    keen: {
      timestamp: new Date().toISOString()
    },
    searchRequest: searchRequest,
    auth: auth
  };

  client.addEvent('newsSearch', event, function (errEvent) {
    if (errEvent) {
      logger.warn('newsSearch save err:', errEvent);
    }
  });
};

module.exports = {
  errorCase: errorCase,
  errorCaseSubscription: errorCaseSubscription,
  errorNews: errorNews,
  checkCase: checkCase,
  checkCaseSubscription: checkCaseSubscription,
  newsSearch: newsSearch
};