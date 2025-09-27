'use strict';

const db = require('../database');
const plugins = require('../plugins');

module.exports = function (Polls) {
	const votesInProgress = {};

	Polls.vote = async function (pollId, optionId, uid) {
		await validateVote(pollId, optionId, uid);
		
		if (voteInProgress(pollId, uid)) {
			throw new Error('[[error:already-voting-for-this-poll]]');
		}

		putVoteInProgress(pollId, uid);
		try {
			return await castVote(pollId, optionId, uid);
		} finally {
			clearVoteProgress(pollId, uid);
		}
	};

	Polls.unvote = async function (pollId, uid) {
		if (voteInProgress(pollId, uid)) {
			throw new Error('[[error:already-voting-for-this-poll]]');
		}

		const currentVote = await Polls.getUserVote(pollId, uid);
		if (!currentVote) {
			throw new Error('[[error:no-vote-to-remove]]');
		}

		putVoteInProgress(pollId, uid);
		try {
			await removeVote(pollId, currentVote.optionId, uid);
			return { pollId: String(pollId), uid: String(uid) };
		} finally {
			clearVoteProgress(pollId, uid);
		}
	};

	Polls.getUserVote = async function (pollId, uid) {
		if (!uid || parseInt(uid, 10) <= 0) {
			return null;
		}
		const optionId = await db.sortedSetScore(`poll:${pollId}:voters`, uid);
		return optionId !== null ? {
			pollId: String(pollId),
			optionId: String(optionId),
			uid: String(uid),
		} : null;
	};

	Polls.hasVoted = async function (pollId, uid) {
		if (!uid || parseInt(uid, 10) <= 0) {
			return false;
		}
		return await db.isSortedSetMember(`poll:${pollId}:voters`, uid);
	};

	Polls.canVote = async function (pollId, uid) {
		if (!uid || parseInt(uid, 10) <= 0) {
			return false;
		}

		const [pollData, hasVoted] = await Promise.all([
			Polls.getPollData(pollId),
			Polls.hasVoted(pollId, uid),
		]);

		if (!pollData || pollData.deleted) {
			return false;
		}

		if (pollData.endDate && pollData.endDate < Date.now()) {
			return false;
		}

		if (hasVoted && (!pollData.settings || !pollData.settings.allowRevote)) {
			return false;
		}

		return true;
	};

	Polls.getVoteCount = async function (pollId) {
		return await db.sortedSetCard(`poll:${pollId}:voters`);
	};

	Polls.getOptionVoteCount = async function (optionId) {
		return await db.setCount(`option:${optionId}:voters`);
	};

	async function validateVote(pollId, optionId, uid) {
		if (!pollId || !optionId || !uid || parseInt(uid, 10) <= 0) {
			throw new Error('[[error:invalid-data]]');
		}

		const [pollExists, optionExists] = await Promise.all([
			Polls.exists(pollId),
			db.isSortedSetMember(`poll:${pollId}:options`, optionId),
		]);

		if (!pollExists) {
			throw new Error('[[error:poll-not-found]]');
		}
		if (!optionExists) {
			throw new Error('[[error:invalid-poll-option]]');
		}
	}

	async function castVote(pollId, optionId, uid) {
		const currentVote = await Polls.getUserVote(pollId, uid);
		const isRevote = !!currentVote;

		if (currentVote) {
			await removeVote(pollId, currentVote.optionId, uid);
		}

		await Promise.all([
			db.sortedSetAdd(`poll:${pollId}:voters`, optionId, uid),
			db.setAdd(`option:${optionId}:voters`, uid),
			Polls.incrementVoteCount(optionId, 1),
		]);

		plugins.hooks.fire('action:poll.vote', {
			pollId, optionId, uid, isRevote,
		});

		return {
			pollId: String(pollId),
			optionId: String(optionId),
			uid: String(uid),
			isRevote,
		};
	}

	async function removeVote(pollId, optionId, uid) {
		await Promise.all([
			db.sortedSetRemove(`poll:${pollId}:voters`, uid),
			db.setRemove(`option:${optionId}:voters`, uid),
			Polls.incrementVoteCount(optionId, -1),
		]);

		plugins.hooks.fire('action:poll.unvote', {
			pollId, optionId, uid,
		});
	}

	function voteInProgress(pollId, uid) {
		return votesInProgress[`${pollId}:${uid}`];
	}

	function putVoteInProgress(pollId, uid) {
		votesInProgress[`${pollId}:${uid}`] = true;
	}

	function clearVoteProgress(pollId, uid) {
		delete votesInProgress[`${pollId}:${uid}`];
	}
};