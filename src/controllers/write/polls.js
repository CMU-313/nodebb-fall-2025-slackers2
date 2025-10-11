'use strict';

const Polls = require('../../polls');
const helpers = require('../helpers');

const pollsController = module.exports;

// Poll CRUD operations
pollsController.get = async function (req, res) {
	try {
		const { pollId } = req.params;
		const pollData = await Polls.getPollData(pollId);
		
		if (!pollData) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		const [options, userVote, canVote] = await Promise.all([
			Polls.getPollOptions(pollId),
			Polls.getUserVote(pollId, req.uid),
			Polls.canVote(pollId, req.uid),
		]);

		const responseData = {
			...pollData,
			options,
			userVote,
			canVote,
			voteCount: await Polls.getVoteCount(pollId),
		};

		helpers.formatApiResponse(200, res, responseData);
	} catch (err) {
		helpers.formatApiResponse(500, res, err);
	}
};

pollsController.create = async function (req, res) {
	try {
		const pollData = req.body;
		const pollId = await Polls.create(pollData, req.uid);
		const createdPoll = await Polls.getPollData(pollId);
		
		// Add options to match schema expectations
		const options = await Polls.getPollOptions(pollId);
		const responseData = {
			...createdPoll,
			options,
		};
		
		helpers.formatApiResponse(200, res, responseData);
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

pollsController.update = async function (req, res) {
	try {
		const { pollId } = req.params;
		const updateData = req.body;
		
		const pollExists = await Polls.exists(pollId);
		if (!pollExists) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		await Polls.setPollFields(pollId, updateData);
		const updatedPoll = await Polls.getPollData(pollId);
		
		// Add options to match schema expectations
		const options = await Polls.getPollOptions(pollId);
		const responseData = {
			...updatedPoll,
			options,
		};
		
		helpers.formatApiResponse(200, res, responseData);
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

pollsController.delete = async function (req, res) {
	try {
		const { pollId } = req.params;
		
		const pollExists = await Polls.exists(pollId);
		if (!pollExists) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		await Polls.setPollField(pollId, 'deleted', 1);
		const cid = await Polls.getPollTopic(pollId).then((tid) => {
			const Topics = require('../../topics');
			return Topics.getTopicField(tid, 'cid');
		});
		await Polls.removePollFromSets(pollId, cid);
		
		helpers.formatApiResponse(200, res, { message: '[[success:poll-deleted]]' });
	} catch (err) {
		helpers.formatApiResponse(500, res, err);
	}
};

// Poll voting operations
pollsController.vote = async function (req, res) {
	try {
		const { pollId } = req.params;
		const { optionId } = req.body;
		
		const voteResult = await Polls.vote(pollId, optionId, req.uid);
		
		helpers.formatApiResponse(200, res, voteResult);
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

pollsController.unvote = async function (req, res) {
	try {
		const { pollId } = req.params;
		
		const unvoteResult = await Polls.unvote(pollId, req.uid);
		
		helpers.formatApiResponse(200, res, unvoteResult);
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

// Poll results and data
pollsController.results = async function (req, res) {
	try {
		const { pollId } = req.params;
		
		const pollExists = await Polls.exists(pollId);
		if (!pollExists) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		const [options, voteCount] = await Promise.all([
			Polls.getPollOptions(pollId),
			Polls.getVoteCount(pollId),
		]);

		const results = {
			pollId,
			totalVotes: voteCount,
			options: await Promise.all(options.map(async option => ({
				...option,
				voteCount: await Polls.getOptionVoteCount(option.optionId),
				percentage: voteCount > 0 ? 
					((await Polls.getOptionVoteCount(option.optionId)) / voteCount * 100).toFixed(1) : 0,
			}))),
		};
		
		helpers.formatApiResponse(200, res, results);
	} catch (err) {
		helpers.formatApiResponse(500, res, err);
	}
};

pollsController.options = async function (req, res) {
	try {
		const { pollId } = req.params;
		
		const pollExists = await Polls.exists(pollId);
		if (!pollExists) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		const options = await Polls.getPollOptions(pollId);
		
		helpers.formatApiResponse(200, res, options);
	} catch (err) {
		helpers.formatApiResponse(500, res, err);
	}
};

pollsController.voters = async function (req, res) {
	try {
		const { pollId } = req.params;
		const start = parseInt(req.query.start, 10) || 0;
		const stop = parseInt(req.query.stop, 10) || 19;
		
		const pollExists = await Polls.exists(pollId);
		if (!pollExists) {
			return helpers.formatApiResponse(404, res, '[[error:poll-not-found]]');
		}

		const db = require('../../database');
		const voterUids = await db.getSortedSetRange(`poll:${pollId}:voters`, start, stop);
		
		const User = require('../../user');
		const voters = await User.getUsersFields(voterUids, ['uid', 'username', 'userslug', 'picture']);
		
		helpers.formatApiResponse(200, res, voters);
	} catch (err) {
		helpers.formatApiResponse(500, res, err);
	}
};

// Poll options management
pollsController.addOption = async function (req, res) {
	try {
		const { pollId } = req.params;
		const { text } = req.body;
		
		if (!text || typeof text !== 'string') {
			return helpers.formatApiResponse(400, res, '[[error:invalid-option-text]]');
		}

		const optionId = await Polls.addOption(pollId, text, req.uid);
		const optionData = await Polls.getPollOptionData(optionId);
		
		helpers.formatApiResponse(200, res, optionData);
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

pollsController.removeOption = async function (req, res) {
	try {
		const { pollId, optionId } = req.params;
		
		await Polls.removeOption(pollId, optionId, req.uid);
		
		helpers.formatApiResponse(200, res, { message: '[[success:option-removed]]' });
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

// Poll lifecycle
pollsController.close = async function (req, res) {
	try {
		const { pollId } = req.params;
		
		await Polls.close(pollId, req.uid);
		
		helpers.formatApiResponse(200, res, { message: '[[success:poll-closed]]' });
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};

pollsController.reopen = async function (req, res) {
	try {
		const { pollId } = req.params;
		const { endDate } = req.body;
		
		await Polls.reopen(pollId, endDate, req.uid);
		
		helpers.formatApiResponse(200, res, { message: '[[success:poll-reopened]]' });
	} catch (err) {
		helpers.formatApiResponse(400, res, err);
	}
};