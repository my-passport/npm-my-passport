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

var festivalsController = require('./controller/festivals');
var categoriesController = require('./controller/categories');
var eventsController = require('./controller/events');
var placesController = require('./controller/places');
var newsController = require('./controller/news');

var logger = require('./logger/logger').logger;
var keen = require('./keen');
var festivals = require('./festivals');

var festivalsModel = require('festivals-model');
var FestivalNotFoundError = festivalsModel.error.FestivalNotFoundError;

var startServer = function startServer(callback) {
  fs.readFile('config/public.key', function (err, data) {
    if (err) {
      logger.debug('config/public.key read error: ', err);
      throw err;
    }

    var options = {
      appName: 'festivals',
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
        'application/vnd.festivals.v1+json',
        'application/vnd.festivals.v1+xml'
      ]
    };

    var errorHandlers = {
      EventNotFound: {
        className: 'NotFoundError'
      },
      EventPlaceNotFound: {
        className: 'NotFoundError'
      },
      FestivalNotFound: {
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
      res.cache('public', {maxAge: 3600});
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
    var festivalExistsPreconditionHandler = function festivalExistsPreconditionHandler(req, res, next) {
      return next();
    };
    //
    //var festivalExistsPreconditionHandler = function festivalExistsPreconditionHandler(req, res, next) {
    //  var id = req.params.id || '';
    //
    //  if (!id) {
    //    return next(new FestivalNotFoundError('Festival not found'));
    //  }
    //
    //  festivals.getFestival(id, {}, function (errFestival, festival) {
    //    if (errFestival) {
    //      keen.errorFestival('get', req.authorization.bearer, req.params, errFestival);
    //    }
    //
    //    next.ifError(errFestival);
    //
    //    if (!festival) {
    //      return next(new FestivalNotFoundError('Festival not found'));
    //    }
    //
    //    if (req.authorization.bearer.userId !== festival.userId) {
    //      return next(new ForbiddenError('Unable to update selected category', 'Brak uprawnień do edycji kategorii wybranego festiwalu'));
    //    }
    //
    //    return next();
    //  });
    //};

    var routes = {
      get: [],
      post: [],
      put: [],
      del: []
    };

    routes.get.push({
      options: {
        path: '/api/festivals', version: '1.0.0'
      },
      authMethod: function readFestivalsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('festivals:get', 'Brak uprawnień do pobierania festiwali')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: festivalsController.getFestivalsV1
    });

    routes.post.push({
      options: {
        path: '/api/festivals', version: '1.0.0'
      },
      authMethod: function createFestivalsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('festivals:create', 'Brak uprawnień do tworzenia festiwali')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: festivalsController.createFestivalV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id', version: '1.0.0'
      },
      authMethod: function readFestivalsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('festivals:get', 'Brak uprawnień do pobierania festiwali')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: festivalsController.getFestivalV1
    });

    routes.put.push({
      options: {
        path: '/api/festivals/:id', version: '1.0.0'
      },
      authMethod: function updateFestivalsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('festivals:update', 'Brak uprawnień do aktualizacji festiwali')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: festivalsController.updateFestivalV1
    });

    routes.del.push({
      options: {
        path: '/api/festivals/:id', version: '1.0.0'
      },
      authMethod: function deleteFestivalsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('festivals:delete', 'Brak uprawnień do usuwania festiwali')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: festivalsController.deleteFestivalV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/categories', version: '1.0.0'
      },
      authMethod: function readCategoriesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('categories:get', 'Brak uprawnień do pobierania kategorii')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: categoriesController.getFestivalCategoriesV1
    });

    routes.post.push({
      options: {
        path: '/api/festivals/:id/categories', version: '1.0.0'
      },
      authMethod: function createCategoriesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('categories:create', 'Brak uprawnień do tworzenia kategorii')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: categoriesController.createFestivalCategoryV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/categories/:category.id', version: '1.0.0'
      },
      authMethod: function readCategoriesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('categories:get', 'Brak uprawnień do pobierania kategorii')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: categoriesController.getFestivalCategoryV1
    });

    routes.put.push({
      options: {
        path: '/api/festivals/:id/categories/:category.id', version: '1.0.0'
      },
      authMethod: function updateCategoriesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('categories:update', 'Brak uprawnień do aktualizacji kategorii')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: categoriesController.updateFestivalCategoryV1
    });

    routes.del.push({
      options: {
        path: '/api/festivals/:id/categories/:category.id', version: '1.0.0'
      },
      authMethod: function deleteCategoriesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('categories:delete', 'Brak uprawnień do usuwania kategorii')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: categoriesController.deleteFestivalCategoryV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/events', version: '1.0.0'
      },
      authMethod: function readEventsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('events:get', 'Brak uprawnień do pobierania wydarzeń')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      controllerMethod: eventsController.getFestivalEventsV1
    });

    routes.post.push({
      options: {
        path: '/api/festivals/:id/events', version: '1.0.0'
      },
      authMethod: function createEventsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('events:create', 'Brak uprawnień do tworzenia wydarzeń')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: eventsController.createFestivalEventV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/events/:event.id', version: '1.0.0'
      },
      authMethod: function readEventsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('events:get', 'Brak uprawnień do pobierania wydarzeń')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: eventsController.getFestivalEventV1
    });

    routes.put.push({
      options: {
        path: '/api/festivals/:id/events/:event.id', version: '1.0.0'
      },
      authMethod: function updateEventsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('events:update', 'Brak uprawnień do aktualizacji wydarzeń')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: eventsController.updateFestivalEventV1
    });

    routes.del.push({
      options: {
        path: '/api/festivals/:id/events/:event.id', version: '1.0.0'
      },
      authMethod: function deleteEventsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('events:delete', 'Brak uprawnień do usuwania wydarzeń')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: eventsController.deleteFestivalEventV1
    });


    routes.get.push({
      options: {
        path: '/api/festivals/:id/news', version: '1.0.0'
      },
      authMethod: function readFestivalsNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:get', 'Brak uprawnień do pobierania wiadomości')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: newsController.getNewsCollectionV1
    });

    routes.post.push({
      options: {
        path: '/api/festivals/:id/news', version: '1.0.0'
      },
      authMethod: function createFestivalsnewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:create', 'Brak uprawnień do tworzenia wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: newsController.createNewsV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/news/:news.id', version: '1.0.0'
      },
      authMethod: function readFestivalsnewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:get', 'Brak uprawnień do pobierania wiadomości')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: newsController.getNewsV1
    });

    routes.put.push({
      options: {
        path: '/api/festivals/:id/news/:news.id', version: '1.0.0'
      },
      authMethod: function updateFestivalsnewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:update', 'Brak uprawnień do aktualizacji wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: newsController.updateNewsV1
    });

    routes.del.push({
      options: {
        path: '/api/festivals/:id/news/:news.id', version: '1.0.0'
      },
      authMethod: function deleteFestivalsnewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:delete', 'Brak uprawnień do usuwania wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: newsController.deleteNewsV1
    });

    routes.get.push({
      options: {
        path: '/api/news', version: '1.0.0'
      },
      authMethod: function readNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:get', 'Brak uprawnień do pobierania wiadomości')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: newsController.getNewsCollectionV1
    });

    routes.post.push({
      options: {
        path: '/api/news', version: '1.0.0'
      },
      authMethod: function createNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:create', 'Brak uprawnień do tworzenia wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: newsController.createNewsV1
    });

    routes.get.push({
      options: {
        path: '/api/news/:news.id', version: '1.0.0'
      },
      authMethod: function readNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:get', 'Brak uprawnień do pobierania wiadomości')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: newsController.getNewsV1
    });

    routes.put.push({
      options: {
        path: '/api/news/:news.id', version: '1.0.0'
      },
      authMethod: function updateNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:update', 'Brak uprawnień do aktualizacji wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: newsController.updateNewsV1
    });

    routes.del.push({
      options: {
        path: '/api/news/:news.id', version: '1.0.0'
      },
      authMethod: function deleteNewsAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('news:delete', 'Brak uprawnień do usuwania wiadomości')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: noPreconditionHandler,
      controllerMethod: newsController.deleteNewsV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/places', version: '1.0.0'
      },
      authMethod: function readPlacesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('places:get', 'Brak uprawnień do pobierania sal')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: placesController.getFestivalPlacesV1
    });

    routes.post.push({
      options: {
        path: '/api/festivals/:id/places', version: '1.0.0'
      },
      authMethod: function createPlacesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('places:create', 'Brak uprawnień do tworzenia sal')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: placesController.createFestivalPlaceV1
    });

    routes.get.push({
      options: {
        path: '/api/festivals/:id/places/:place.id', version: '1.0.0'
      },
      authMethod: function readPlacesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('places:get', 'Brak uprawnień do pobierania sal')
          .user()
          .next();
      },
      cache: publicCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: placesController.getFestivalPlaceV1
    });

    routes.put.push({
      options: {
        path: '/api/festivals/:id/places/:place.id', version: '1.0.0'
      },
      authMethod: function updatePlacesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('places:update', 'Brak uprawnień do aktualizacji sal')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: placesController.updateFestivalPlaceV1
    });

    routes.del.push({
      options: {
        path: '/api/festivals/:id/places/:place.id', version: '1.0.0'
      },
      authMethod: function deletePlacesAuthHandler(req, res, next) {

        return oauth(req, next)
          .scope('places:delete', 'Brak uprawnień do usuwania sal')
          .user()
          .next();
      },
      cache: noCacheHandler,
      precondition: festivalExistsPreconditionHandler,
      controllerMethod: placesController.deleteFestivalPlaceV1
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
