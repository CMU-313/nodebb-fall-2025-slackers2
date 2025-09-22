'use strict';

const db = require('../database');
const user = require('../user');

const Polls = module.exports;

require('./create')(Polls);
Polls.getPollData = async function (pollId) {
	if (!pollId) {
		return null;
	}
	const poll = await db.getObject(`poll:${pollId}`);
	if (!poll) {
		return null;
	}
	if (poll.uid) {
		poll.uid = String(poll.uid);
	}
	if (poll.pollId) {
		poll.pollId = String(poll.pollId);
	}
	if (poll.settings && typeof poll.settings === 'string') {
		try {
			poll.settings = JSON.parse(poll.settings);
		} catch (e) {
		}
	}
	return poll;
};

Polls.getPollOptions = async function (pollId) {
	if (!pollId) {
		return [];
	}
	const optionIds = await db.getSortedSetRange(`poll:${pollId}:options`, 0, -1);
	if (!optionIds.length) {
		return [];
	}
	const keys = optionIds.map(optionId => `polloption:${optionId}`);
	const options = await db.getObjects(keys);
	return options.filter(Boolean).map((option) => {
		if (option.optionId) {
			option.optionId = String(option.optionId);
		}
		if (option.pollId) {
			option.pollId = String(option.pollId);
		}
		return option;
	});
};

Polls.exists = async function (pollIds) {
	if (Array.isArray(pollIds)) {
		const keys = pollIds.map(pollId => `poll:${pollId}`);
		return await db.exists(keys);
	}
	return await db.exists(`poll:${pollIds}`);
};

Polls.validatePollData = async function (pollData) {
	if (!pollData) {
		throw new Error('Poll data is required');
	}
	if (!pollData.title || typeof pollData.title !== 'string') {
		throw new Error('Poll title is required');
	}
	if (pollData.title.length > 255) {
		throw new Error('Poll title must be less than 255 characters');
	}
	if (!Array.isArray(pollData.options) || pollData.options.length < 2) {
		throw new Error('Poll must have at least 2 options');
	}
	if (pollData.options.length > 10) {
		throw new Error('Poll must have less than 10 options');
	}
	return true;
};

Polls.isAdmin = async function (uid) {
	if (!uid || parseInt(uid, 10) <= 0) {
		return false;
	}
	return await user.isAdministrator(uid);
};

Polls.getPollByTopic = async function (tid) {
	const pollId = await Polls.getPollIdByTopic(tid);
	if (!pollId) {
		return null;
	}
	return await Polls.getPollData(pollId);
};

Polls.getPollIdByTopic = async function (tid) {
	return await db.getObjectField(`topic:${tid}`, 'pollId');
};

Polls.linkPollToTopic = async function (pollId, tid) {
	await db.setObjectField(`topic:${tid}`, 'pollId', pollId);
	await db.setObjectField(`poll:${pollId}`, 'tid', tid);
};

Polls.addPollToSets = async function (pollId, timestamp, cid) {
	timestamp = timestamp || Date.now();
	await db.sortedSetAdd('polls:created', timestamp, pollId);
	if (cid) {
		await db.sortedSetAdd(`cid:${cid}:polls`, timestamp, pollId);
	}
};

Polls.removePollFromSets = async function (pollId, cid) {
	await db.sortedSetRemove('polls:created', pollId);
	if (cid) {
		await db.sortedSetRemove(`cid:${cid}:polls`, pollId);
	}
};

Polls.setPollField = async function (pollId, field, value) {
	await db.setObjectField(`poll:${pollId}`, field, value);
	await db.setObjectField(`poll:${pollId}`, 'updated', Date.now());
};

Polls.getPollTopic = async function (pollId) {
	return await db.getObjectField(`poll:${pollId}`, 'tid');
};

require('../promisify')(Polls);
