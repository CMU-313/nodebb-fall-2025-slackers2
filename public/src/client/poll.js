'use strict';

define('forum/poll', ['forum/polls'], function (polls) {
	const Poll = {};

	Poll.init = function () {
		polls.init();
	};

	return Poll;
});
