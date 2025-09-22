'use strict';

const db = require('../../database');
const batch = require('../../batch');

module.exports = {
	name: 'Add anonymous field to posts',
	timestamp: Date.UTC(2025, 8, 21),
	method: async function () {
		const { progress } = this;
		
		// Get all post keys
		const postKeys = await db.getSortedSetRange('posts:pid', 0, -1);
		progress.total = postKeys.length;

		await batch.processArray(postKeys, async (pids) => {
			progress.incr(pids.length);
			
			// Get all post objects
			const keys = pids.map(pid => `post:${pid}`);
			const posts = await db.getObjects(keys);
			
			// Update posts that don't have the anonymous field
			const updates = [];
			posts.forEach((post, index) => {
				if (post && !post.hasOwnProperty('anonymous')) {
					updates.push([keys[index], { anonymous: 0 }]);
				}
			});
			
			if (updates.length > 0) {
				await db.setObjectBulk(updates);
			}
		}, {
			progress: progress,
			batch: 500,
		});
	},
};
