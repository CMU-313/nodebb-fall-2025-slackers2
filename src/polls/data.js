'use strict';

const db = require('../database');
const plugins = require('../plugins');

const intFields = [
	'pollId', 'uid', 'created', 'updated', 'deleted', 'endDate',
	'optionId', 'votes', 'index',
];

module.exports = function (Polls) {
	Polls.getPollsFields = async function (pollIds, fields) {
		if (!Array.isArray(pollIds) || !pollIds.length) {
			return [];
		}
		const keys = pollIds.map(pollId => `poll:${pollId}`);
		const pollsData = await db.getObjects(keys, fields);
		const result = await plugins.hooks.fire('filter:poll.getFields', {
			pollIds: pollIds,
			polls: pollsData,
			fields: fields,
		});
		result.polls.forEach(poll => modifyPoll(poll, fields));
		return result.polls;
	};

	Polls.getPollData = async function (pollId) {
		const polls = await Polls.getPollsFields([pollId], []);
		return polls && polls.length ? polls[0] : null;
	};

	Polls.getPollsData = async function (pollIds) {
		return await Polls.getPollsFields(pollIds, []);
	};

	Polls.getPollField = async function (pollId, field) {
		const poll = await Polls.getPollFields(pollId, [field]);
		return poll && poll.hasOwnProperty(field) ? poll[field] : null;
	};

	Polls.getPollFields = async function (pollId, fields) {
		const polls = await Polls.getPollsFields([pollId], fields);
		return polls ? polls[0] : null;
	};

	Polls.setPollField = async function (pollId, field, value) {
		await Polls.setPollFields(pollId, { [field]: value });
	};

	Polls.setPollFields = async function (pollId, data) {
		data.updated = Date.now();
		await db.setObject(`poll:${pollId}`, data);
		plugins.hooks.fire('action:poll.setFields', { data: { ...data, pollId } });
	};

	Polls.getPollOptionsFields = async function (optionIds, fields) {
		if (!Array.isArray(optionIds) || !optionIds.length) {
			return [];
		}
		const keys = optionIds.map(optionId => `polloption:${optionId}`);
		const optionsData = await db.getObjects(keys, fields);
		const result = await plugins.hooks.fire('filter:polloption.getFields', {
			optionIds: optionIds,
			options: optionsData,
			fields: fields,
		});
		result.options.forEach(option => modifyPollOption(option, fields));
		return result.options;
	};

	Polls.getPollOptionData = async function (optionId) {
		const options = await Polls.getPollOptionsFields([optionId], []);
		return options && options.length ? options[0] : null;
	};

	Polls.getPollOptionsData = async function (optionIds) {
		return await Polls.getPollOptionsFields(optionIds, []);
	};

	Polls.getPollOptionField = async function (optionId, field) {
		const option = await Polls.getPollOptionFields(optionId, [field]);
		return option && option.hasOwnProperty(field) ? option[field] : null;
	};

	Polls.getPollOptionFields = async function (optionId, fields) {
		const options = await Polls.getPollOptionsFields([optionId], fields);
		return options ? options[0] : null;
	};

	Polls.setPollOptionField = async function (optionId, field, value) {
		await Polls.setPollOptionFields(optionId, { [field]: value });
	};

	Polls.setPollOptionFields = async function (optionId, data) {
		await db.setObject(`polloption:${optionId}`, data);
		plugins.hooks.fire('action:polloption.setFields', { data: { ...data, optionId } });
	};

	Polls.getPollOptions = async function (pollId) {
		if (!pollId) {
			return [];
		}
		const optionIds = await db.getSortedSetRange(`poll:${pollId}:options`, 0, -1);
		if (!optionIds.length) {
			return [];
		}
		return await Polls.getPollOptionsData(optionIds);
	};

	Polls.incrementVoteCount = async function (optionId, increment = 1) {
		const newCount = await db.incrObjectField(`polloption:${optionId}`, 'votes', increment);
		plugins.hooks.fire('action:polloption.vote', { optionId, increment, newCount });
		return newCount;
	};

	Polls.getRecentPolls = async function (start, stop) {
		const pollIds = await db.getSortedSetRevRange('polls:created', start, stop);
		return await Polls.getPollsData(pollIds);
	};

	Polls.getPollsByCategory = async function (cid, start, stop) {
		const pollIds = await db.getSortedSetRevRange(`cid:${cid}:polls`, start, stop);
		return await Polls.getPollsData(pollIds);
	};

	Polls.getPollCount = async function () {
		return await db.sortedSetCard('polls:created');
	};

	Polls.getCategoryPollCount = async function (cid) {
		return await db.sortedSetCard(`cid:${cid}:polls`);
	};
};
