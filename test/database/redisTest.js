var rewire = require('rewire');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

describe('database redis test', function () {
  var clientMock = {

    on: function on(event, callback) {
    }
  };

  var redisMock = {

    createClient: function createClient(options) {
      return clientMock;
    }
  };

  var redis = rewire('../../lib/database/redis');

  redis.__set__({
    redis: redisMock
  });

  it('should get subscriber tokens', function (done) {

    clientMock.smembers = function smembers(caseSubscriptionName, callback) {
      var res = ["token1", "token2"];
      return callback(null, res);
    };

    var redisDatabase = new redis.Redis();
    redisDatabase.getSubscriberTokens('caseNumber', function (err, tokens) {
      expect(tokens, 'tokens').to.be.an('array');
      expect(err, 'err').to.be.null;
      done();
    });
  });


});
