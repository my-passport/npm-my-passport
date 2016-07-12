'use strict';

var options = require('config');
var assert = require('assert-plus');
var myPassportClient = require('my-passport-client');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;
var keen = require('../keen');
var pushSubscriptions = require('../push/pushSubscriptions');

var checkCaseStatusV1 = function checkCaseStatusV1(req, res, next) {
  try {
    assert.object(req.params, 'params');
    assert.string(req.params.id, 'id');

  }
  catch (e) {
    return next(new BadRequestError(e.message));
  }

  var id = req.params.id;

  return myPassportClient.checkCaseStatus(id, options, function (err, response) {
    if (err) {
      keen.errorCase(req.authorization.bearer, req.params, err);
    }
    next.ifError(err);

    res.send(200, response);
    next();

    return keen.checkCase(req.authorization.bearer, req.params);
  });
};

var createPassportSubscriptionV1 = function createPassportSubscriptionV1(req, res, next) {
  try {
    assert.object(req.params, 'params');
    assert.string(req.params.token, 'token');
    assert.string(req.params.id, 'id');

  }
  catch (e) {
    return next(new BadRequestError(e.message));
  }

  var caseNumber = req.params.id;
  var token = req.params.token;

  return pushSubscriptions.createCaseSubscription(caseNumber, token, function (err, response) {
    if (err) {
      keen.errorCaseSubscription(req.authorization.bearer, req.params, err);
    }
    next.ifError(err);

    res.send(201, response);
    next();

    return keen.checkCaseSubscription(req.authorization.bearer, req.params);
  });
};

module.exports = {
  checkCaseStatusV1: checkCaseStatusV1,
  createPassportSubscriptionV1: createPassportSubscriptionV1
};
