'use strict';

const router = require('express').Router();
const middleware = require('../../middleware');
const controllers = require('../../controllers');
const routeHelpers = require('../helpers');

module.exports = function () {
	const middlewares = [middleware.ensureLoggedIn];

	// Poll CRUD operations
	routeHelpers.setupApiRoute(router, 'get', '/:pollId', [], controllers.write.polls.get);
	routeHelpers.setupApiRoute(router, 'post', '/', middlewares, controllers.write.polls.create);
	routeHelpers.setupApiRoute(router, 'put', '/:pollId', middlewares, controllers.write.polls.update);
	routeHelpers.setupApiRoute(router, 'delete', '/:pollId', middlewares, controllers.write.polls.delete);

	// Poll voting operations
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/vote', middlewares, controllers.write.polls.vote);
	routeHelpers.setupApiRoute(router, 'delete', '/:pollId/vote', middlewares, controllers.write.polls.unvote);

	// Poll results and data
	routeHelpers.setupApiRoute(router, 'get', '/:pollId/results', [], controllers.write.polls.results);
	routeHelpers.setupApiRoute(router, 'get', '/:pollId/options', [], controllers.write.polls.options);
	routeHelpers.setupApiRoute(router, 'get', '/:pollId/voters', [], controllers.write.polls.voters);

	// Poll options management
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/options', middlewares, controllers.write.polls.addOption);
	routeHelpers.setupApiRoute(router, 'delete', '/:pollId/options/:optionId', middlewares, controllers.write.polls.removeOption);

	// Poll lifecycle
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/close', middlewares, controllers.write.polls.close);
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/reopen', middlewares, controllers.write.polls.reopen);

	return router;
};
