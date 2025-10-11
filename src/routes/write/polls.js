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

	// Poll lifecycle
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/close', middlewares, controllers.write.polls.close);
	routeHelpers.setupApiRoute(router, 'post', '/:pollId/reopen', middlewares, controllers.write.polls.reopen);

	return router;
};
