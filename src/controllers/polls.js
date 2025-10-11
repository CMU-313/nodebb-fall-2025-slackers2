'use strict';

const Polls = require('../polls');
const helpers = require('./helpers');

const pollsController = module.exports;

pollsController.view = async function (req, res, next) {
	const pollId = req.params.poll_id;
	
	try {
		const [pollData, pollOptions, userVote, canVote] = await Promise.all([
			Polls.getPollData(pollId),
			Polls.getPollOptions(pollId),
			Polls.getUserVote(pollId, req.uid),
			Polls.canVote(pollId, req.uid),
		]);

		if (!pollData) {
			return next();
		}

		// Get category data if poll is linked to a category
		let categoryData = null;
		if (pollData.cid) {
			const categories = require('../categories');
			const category = await categories.getCategories([pollData.cid]);
			if (category && category.length) {
				categoryData = category[0];
			}
		}

		const poll = {
			...pollData,
			options: pollOptions,
			userVote: userVote,
			canVote: canVote,
			voteCount: await Polls.getVoteCount(pollId),
		};

		// Handle API requests
		if (res.locals.isAPI) {
			return helpers.formatApiResponse(200, res, poll);
		}

		// Handle page rendering
		const data = {
			title: poll.title,
			poll: poll,
			category: categoryData,
			privileges: req.privileges || {},
		};

		res.render('poll', data);
	} catch (err) {
		next(err);
	}
};
