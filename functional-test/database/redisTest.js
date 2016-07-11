var options = require('config');
var mainClient = require('../../lib/database/main');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

describe('main database test', function () {

  it('should get main data', function (done) {

    mainClient.getMainPageData(options, function (err, data) {
      //console.log(err);
      // console.dir(data, {depth: null});
      expect(data, 'data').to.be.not.undefined;
      expect(err, 'err').to.be.null;
      done();
    });
  });


});
