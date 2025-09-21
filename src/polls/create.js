'use strict';

const db = require('../database');
const plugins = require('../plugins');
const Topics = require('../topics');

module.exports = function (Polls) {
	
	Polls.create = async function (pollData, uid) {
		if (!(await Polls.isAdmin(uid))) {
			throw new Error('[[error:no-privileges]]');
		}
		await Polls.validatePollData(pollData);
		const pollId = String(await db.incrObjectField('global', 'nextPollId'));
		const pollObject = {
			pollId: pollId,
			uid: String(uid),
			title: pollData.title,
			created: Date.now(),
			updated: Date.now(),
			deleted: 0,
		};
		await db.setObject(`poll:${pollId}`, pollObject);
		await createPollOptions(pollId, pollData.options);
		await Polls.addPollToSets(pollId);
		await plugins.hooks.fire('action:poll.save', { poll: pollObject });
		return pollId;
	};

	Polls.createForTopic = async function (pollData, tid, uid) {
		const pollId = await Polls.create(pollData, uid);
		await Polls.linkPollToTopic(pollId, tid);
		await plugins.hooks.fire('action:poll.topic.created', { pollId: pollId, tid: tid });
		return pollId;
	};

	async function createPollOptions(pollId, optionTexts) {
		if (!Array.isArray(optionTexts) || !optionTexts.length) {
			throw new Error('[[error:invalid-poll-options]]');
		}
		
		const optionIds = [];
		
		const optionIdPromises = optionTexts.map(() => db.incrObjectField('global', 'nextPollOptionId'));
		const generatedIds = await Promise.all(optionIdPromises);
		optionIds.push(...generatedIds.map(String));
		const optionPromises = optionTexts.map(async (text, index) => {
			const optionId = optionIds[index];
			const optionData = {
				optionId: optionId,
				pollId: pollId,
				text: text,
				votes: 0,
				index: index,
			};
			await Promise.all([
				db.setObject(`polloption:${optionId}`, optionData),
				db.sortedSetAdd(`poll:${pollId}:options`, index, optionId),
			]);
		});
		
		await Promise.all(optionPromises);
		return optionIds;
	}

	Polls.duplicate = async function (sourcePollId, uid, overrides = {}) {
		const sourcePoll = await Polls.getPollData(sourcePollId);
		if (!sourcePoll) {
			throw new Error('Source poll not found');
		}
		const pollData = {
			title: overrides.title || sourcePoll.title,
			options: overrides.options || await Polls.getPollOptions(sourcePollId).then(opts => opts.map(opt => opt.text)),
		};
		const pollId = await Polls.create(pollData, uid);
		await plugins.hooks.fire('action:poll.duplicate', { pollId: pollId, sourcePollId: sourcePollId });
		return pollId;
	};

	Polls.createFromTemplate = async function (templateData, uid) {
		const pollId = await Polls.create(templateData, uid);
		await plugins.hooks.fire('action:poll.template.created', { pollId: pollId, templateData: templateData });
		return pollId;
	};

	Polls.updateSettings = async function (pollId, settings) {
		const settingsString = typeof settings === 'object' ? JSON.stringify(settings) : settings;
		await Polls.setPollField(pollId, 'settings', settingsString);
		await plugins.hooks.fire('action:poll.settings.updated', { pollId: pollId, settings: settings });
		return pollId;
	};

	Polls.setEndDate = async function (pollId, endDate) {
		await Polls.setPollField(pollId, 'endDate', endDate);
		await plugins.hooks.fire('action:poll.enddate.set', { pollId: pollId, endDate: endDate });
		return pollId;
	};

	Polls.addOption = async function (pollId, optionText, uid) {
		if (!(await Polls.isAdmin(uid))) {
			throw new Error('[[error:no-privileges]]');
		}
		const optionId = String(await db.incrObjectField('global', 'nextPollOptionId'));
		const optionData = {
			optionId: optionId,
			pollId: pollId,
			text: optionText,
			votes: 0,
		};
		await db.setObject(`polloption:${optionId}`, optionData);
		const nextIndex = await db.sortedSetCard(`poll:${pollId}:options`);
		await db.sortedSetAdd(`poll:${pollId}:options`, nextIndex, optionId);
		await plugins.hooks.fire('action:poll.option.added', { pollId: pollId, optionText: optionText });
		return optionId;
	};

	Polls.removeOption = async function (pollId, optionId, uid) {
		if (!(await Polls.isAdmin(uid))) {
			throw new Error('[[error:no-privileges]]');
		}
		await db.delete(`polloption:${optionId}`);
		await db.sortedSetRemove(`poll:${pollId}:options`, optionId);
		await plugins.hooks.fire('action:poll.option.removed', { pollId: pollId, optionId: optionId });
		return pollId;
	};

	Polls.close = async function (pollId, uid) {
		if (!(await Polls.isAdmin(uid))) {
			throw new Error('[[error:no-privileges]]');
		}
		await Polls.setPollField(pollId, 'endDate', Date.now());
		const cid = await Polls.getPollTopic(pollId).then(tid => Topics.getTopicField(tid, 'cid'));
		await Polls.removePollFromSets(pollId, cid);
		await plugins.hooks.fire('action:poll.closed', { pollId: pollId });
		return pollId;
	};

	Polls.reopen = async function (pollId, newEndDate, uid) {
		if (!(await Polls.isAdmin(uid))) {
			throw new Error('[[error:no-privileges]]');
		}
		await Polls.setPollField(pollId, 'endDate', newEndDate);
		const cid = await Polls.getPollTopic(pollId).then(tid => Topics.getTopicField(tid, 'cid'));
		await Polls.addPollToSets(pollId, Date.now(), cid);
		await plugins.hooks.fire('action:poll.reopened', { pollId: pollId, newEndDate: newEndDate });
		return pollId;
	};

};