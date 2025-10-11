'use strict';

const db = require('../../database');

module.exports = {
	name: 'Initialize polls database counters',
	timestamp: Date.UTC(2025, 9, 24),
	method: async function () {
		const existingPollId = await db.getObjectField('global', 'nextPollId');
		const existingPollOptionId = await db.getObjectField('global', 'nextPollOptionId');

		// Only initialize if not already set
		if (!existingPollId) {
			await db.setObjectField('global', 'nextPollId', 1);
			console.log('Initialized nextPollId counter to 1');
		}

		if (!existingPollOptionId) {
			await db.setObjectField('global', 'nextPollOptionId', 1);
			console.log('Initialized nextPollOptionId counter to 1');
		}

		// Also ensure polls:created sorted set exists (even if empty)
		const pollsSetExists = await db.exists('polls:created');
		if (!pollsSetExists) {
			// Create empty set - this is safe and ensures the set exists for queries
			await db.sortedSetAdd('polls:created', [], []);
			console.log('Initialized polls:created sorted set');
		}
	},
};
