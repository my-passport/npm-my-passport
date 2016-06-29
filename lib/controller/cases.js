var options = require('config');
var assert = require('assert-plus');
var myPassportClient = require('my-passport-client');
var myRestifyApi = require('my-restify-api');
var BadRequestError = myRestifyApi.error.BadRequestError;
var keen = require('../keen');

var checkCaseStatus = function checkCaseStatus(req, res, next) {
  try {
    assert.object(req.params, 'params');
    assert.string(req.params.id, 'id');

  }
  catch (e) {
    return next(new BadRequestError(e.message));
  }

  var id = req.params.id;

  myPassportClient.checkCaseStatus(id, options, function (err, response) {
    if (err) {
      keen.errorCase(req.authorization.bearer, req.params, err);
    }
    next.ifError(err);

    res.send(200, response);
    next();

    return keen.checkCase(req.authorization.bearer, req.params);
  });
};

module.exports = {
  checkCaseStatus: checkCaseStatus
};
