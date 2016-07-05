'use strict';

var fs = require('fs');
var myRestifyApi = require('my-restify-api');
var ForbiddenError = myRestifyApi.error.ForbiddenError;
//var oauth = myRestifyApi.plugin.oauth;

var oauth = function (req, next) {
  var context = {};

  context.user = function () {
    return context;
  };

  context.client = function (client) {
    return context;
  };

  context.scope = function (scope, userMessage) {
    return context;
  };

  context.next = function () {
    return next();
  };

  return context;
};

// var newsController = require('./controller/news');
var casesController = require('./controller/cases');

var logger = require('./logger/logger').logger;

var startServer = function startServer(callback) {
  fs.readFile('config/public.key', function (err, data) {
    if (err) {
      logger.debug('config/public.key read error: ', err);
      throw err;
    }

    var options = {
      appName: 'my-passport',
      swagger: {
        enabled: true,
        apiDocsDir: __dirname + '/../public/'
      },
      authorization: {
        authHeaderPrefix: 'x-auth-',
        key: data,
        noVerify: false
      },
      bodyParser: {
        enabled: true,
        options: {
          maxBodySize: 1e6,
          mapParams: true,
          overrideParams: false
        }
      },
      acceptable: [
        'application/vnd.my-passport.v1+json',
        'application/vnd.my-passport.v1+xml'
      ]
    };

    var errorHandlers = {
      InvalidCaseNumberFormat: {
        className: 'BadRequestError'
      },
      CaseNotFound: {
        className: 'NotFoundError'
      },
      ServiceUnavailable: {
        className: 'ServiceUnavailableError'
      },
      '': {
        className: 'ServiceUnavailableError'
      }
    };

    var publicCacheHandler = function publicCacheHandler(req, res, next) {
      res.cache('public', {maxAge: 60});
      res.header('Vary', 'Accept-Language, Accept-Encoding, Accept, Content-Type');
      res.charSet('utf-8');
//    res.header('Last-Modified', new Date());
      return next();
    };

    var noCacheHandler = function noCacheHandler(req, res, next) {
      res.cache('private');
      res.charSet('utf-8');
      return next();
    };

    var noPreconditionHandler = function noPreconditionHandler(req, res, next) {
      return next();
    };

    var routes = {
      get: [],
      post: [],
      put: [],
      del: []
    };

    // routes.get.push({
    //   options: {
    //     path: '/api/news', version: '1.0.0'
    //   },
    //   authMethod: function readNewsAuthHandler(req, res, next) {
    //
    //     return oauth(req, next)
    //       .scope('passport:news:get', 'Brak uprawnień do pobierania wiadomości')
    //       .user()
    //       .next();
    //   },
    //   cache: publicCacheHandler,
    //   precondition: noPreconditionHandler,
    //   controllerMethod: newsController.getNewsCollectionV1
    // });
    //
    // routes.post.push({
    //   options: {
    //     path: '/api/news', version: '1.0.0'
    //   },
    //   authMethod: function createNewsAuthHandler(req, res, next) {
    //
    //     return oauth(req, next)
    //       .scope('passport:news:create', 'Brak uprawnień do tworzenia wiadomości')
    //       .user()
    //       .next();
    //   },
    //   cache: noCacheHandler,
    //   precondition: noPreconditionHandler,
    //   controllerMethod: newsController.createNewsV1
    // });
    //
    // routes.get.push({
    //   options: {
    //     path: '/api/news/:news.id', version: '1.0.0'
    //   },
    //   authMethod: function readNewsAuthHandler(req, res, next) {
    //
    //     return oauth(req, next)
    //       .scope('passport:news:get', 'Brak uprawnień do pobierania wiadomości')
    //       .user()
    //       .next();
    //   },
    //   cache: publicCacheHandler,
    //   precondition: noPreconditionHandler,
    //   controllerMethod: newsController.getNewsV1
    // });
    //
    // routes.put.push({
    //   options: {
    //     path: '/api/news/:news.id', version: '1.0.0'
    //   },
    //   authMethod: function updateNewsAuthHandler(req, res, next) {
    //
    //     return oauth(req, next)
    //       .scope('passport:news:update', 'Brak uprawnień do aktualizacji wiadomości')
    //       .user()
    //       .next();
    //   },
    //   cache: noCacheHandler,
    //   precondition: noPreconditionHandler,
    //   controllerMethod: newsController.updateNewsV1
    // });
    //
    // routes.del.push({
    //   options: {
    //     path: '/api/news/:news.id', version: '1.0.0'
    //   },
    //   authMethod: function deleteNewsAuthHandler(req, res, next) {
    //
    //     return oauth(req, next)
    //       .scope('passport:news:delete', 'Brak uprawnień do usuwania wiadomości')
    //       .user()
    //       .next();
    //   },
    //   cache: noCacheHandler,
    //   precondition: noPreconditionHandler,
    //   controllerMethod: newsController.deleteNewsV1
    // });

    routes.get.push({
      options: {
        path: '/api/passport/cases/:id', version: '1.0.0'
      },
      authMethod: function readCasesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('cases:get', 'Brak uprawnień do pobierania statusu sprawy')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: casesController.checkCaseStatusV1
    });

    var server = myRestifyApi.createServer(routes, errorHandlers, options);

    server.opts(/.*/, function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', req.header('Access-Control-Request-Method'));
      res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
      res.send(200);
      return next();
    });

    myRestifyApi.runServer(server, options, function (errServer, port) {
      logger.debug('myRestifyApi running on port: %d', port);
      return callback(errServer, port);
    });
  });
};

module.exports = {
  startServer: startServer
};
