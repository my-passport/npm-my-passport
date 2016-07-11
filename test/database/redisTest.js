var options = require('config');
var rewire = require('rewire');
var mainClient = rewire('../../lib/client/main');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

describe('main client test', function () {

  it('should get main data', function (done) {

    var responseMock = '<div class="portlet-boundary portlet-boundary_Gotowoscpaszportu_WAR_Gotowoscpaszportuportlet_ portlet-static portlet-static-end portlet-borderless Gotowosc-paszportu-portlet " id="p_p_id_Gotowoscpaszportu_WAR_Gotowoscpaszportuportlet_"><span id="p_Gotowoscpaszportu_WAR_Gotowoscpaszportuportlet"></span> <div class="portlet-borderless-container" style=""> <div class="portlet-body"> <div id="gotowosc-paszportu-data-href" data-href="https://obywatel.gov.pl:443/wyjazd-za-granice/sprawdz-czy-twoj-paszport-jest-gotowy?p_p_id=Gotowoscpaszportu_WAR_Gotowoscpaszportuportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-5&p_p_col_count=1" data-auth="Wgl010OW"></div> </div> </div> </div>';

    var requestMock = function requestMock(opt, callback) {
      return callback(undefined, {statusCode: 200}, responseMock);
    };
    requestMock.jar = function () {
      return {'some data': 'value'};
    };

    mainClient.__set__({
      request: requestMock
    });

    mainClient.getMainPageData(options, function (err, data) {
      //console.log(err);
      // console.dir(data, {depth: null});
      expect(data, 'data').to.be.not.undefined;
      expect(err, 'err').to.be.null;
      done();
    });
  });


});
