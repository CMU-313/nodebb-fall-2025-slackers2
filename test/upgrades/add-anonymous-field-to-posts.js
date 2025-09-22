'use strict';

const assert = require('assert');
const path = require('path');

const db = require('../mocks/databasemock');
const posts = require('../../src/posts');
const topics = require('../../src/topics');
const categories = require('../../src/categories');
const user = require('../../src/user');

const upgradeScript = require('../../src/upgrades/4.4.0/add-anonymous-field-to-posts');

describe('Upgrade: Add anonymous field to posts', () => {
	let testUid;
	let testCid;
	let topicData;
	let postData1;
	let postData2;
	let postData3;

	before(async () => {
		// Create test user
		testUid = await user.create({ username: 'testuser' });
		
		// Create test category
		({ cid: testCid } = await categories.create({
			name: 'Test Category',
			description: 'Test category for upgrade testing',
		}));

		// Create test topic
		({ topicData, postData: postData1 } = await topics.post({
			uid: testUid,
			cid: testCid,
			title: 'Test Topic for Upgrade',
			content: 'This is a test topic for upgrade testing',
		}));

		postData2 = await topics.reply({
			uid: testUid,
			tid: topicData.tid,
			content: 'This is a test reply for upgrade testing',
		});

		postData3 = await topics.reply({
			uid: testUid,
			tid: topicData.tid,
			content: 'This is another test reply for upgrade testing',
		});
	});

	describe('Pre-upgrade state', () => {
		it('should have posts without anonymous field', async () => {
			// Remove anonymous field from posts to simulate pre-upgrade state
			await db.deleteObjectField(`post:${postData1.pid}`, 'anonymous');
			await db.deleteObjectField(`post:${postData2.pid}`, 'anonymous');
			await db.deleteObjectField(`post:${postData3.pid}`, 'anonymous');

			// Check that posts exist but don't have anonymous field
			const post1 = await db.getObject(`post:${postData1.pid}`);
			const post2 = await db.getObject(`post:${postData2.pid}`);
			const post3 = await db.getObject(`post:${postData3.pid}`);

			assert(post1);
			assert(post2);
			assert(post3);
			assert(!post1.hasOwnProperty('anonymous'));
			assert(!post2.hasOwnProperty('anonymous'));
			assert(!post3.hasOwnProperty('anonymous'));
		});

		it('should have posts in the posts:pid sorted set', async () => {
			const allPids = await db.getSortedSetRange('posts:pid', 0, -1);
			assert(allPids.length >= 3);
			assert(allPids.includes(postData1.pid.toString()));
			assert(allPids.includes(postData2.pid.toString()));
			assert(allPids.includes(postData3.pid.toString()));
		});
	});

	describe('Upgrade script execution', () => {
		it('should have correct upgrade script metadata', () => {
			assert.strictEqual(upgradeScript.name, 'Add anonymous field to posts');
			assert(upgradeScript.timestamp);
			assert(typeof upgradeScript.method, 'function');
		});

		it('should run upgrade script without errors', async () => {
			const mockProgress = {
				total: 0,
				incr: function(count) {
				}
			};

			// Run the upgrade script
			await assert.doesNotReject(async () => {
				await upgradeScript.method.bind({ progress: mockProgress })();
			});
		});
	});

	describe('Post-upgrade state', () => {
		it('should add anonymous field to all existing posts', async () => {
			// Check that all posts now have anonymous field set to 0
			const post1 = await db.getObject(`post:${postData1.pid}`);
			const post2 = await db.getObject(`post:${postData2.pid}`);
			const post3 = await db.getObject(`post:${postData3.pid}`);

			assert(post1);
			assert(post2);
			assert(post3);
			assert(post1.hasOwnProperty('anonymous'));
			assert(post2.hasOwnProperty('anonymous'));
			assert(post3.hasOwnProperty('anonymous'));
			assert.strictEqual(parseInt(post1.anonymous), 0);
			assert.strictEqual(parseInt(post2.anonymous), 0);
			assert.strictEqual(parseInt(post3.anonymous), 0);
		});

		it('should not modify posts that already have anonymous field', async () => {
			// Create a new post with anonymous field already set
			const newPost = await posts.create({
				uid: testUid,
				tid: topicData.tid,
				content: 'This post already has anonymous field',
				anonymous: 1,
			});

			// Run upgrade again
			const mockProgress = {
				total: 0,
				incr: function(count) {
				}
			};
			await upgradeScript.method.bind({ progress: mockProgress })();

			// Check that the post still has anonymous: 1
			const post = await db.getObject(`post:${newPost.pid}`);
			assert.strictEqual(parseInt(post.anonymous), 1);
		});

		it('should handle empty posts:pid set gracefully', async () => {
			// Clear the posts:pid set
			await db.delete('posts:pid');
			
			// Run upgrade script
			const mockProgress = {
				total: 0,
				incr: function(count) {
				}
			};

			await assert.doesNotReject(async () => {
				await upgradeScript.method.bind({ progress: mockProgress })();
			});
		});

		it('should handle non-existent post objects gracefully', async () => {
			// Add a non-existent pid to the posts:pid set
			await db.sortedSetAdd('posts:pid', Date.now(), '999999');
			
			// Run upgrade script
			const mockProgress = {
				total: 0,
				incr: function(count) {
				}
			};

			await assert.doesNotReject(async () => {
				await upgradeScript.method.bind({ progress: mockProgress })();
			});
		});
	});

	describe('Batch processing', () => {
		it('should process posts in batches correctly', async () => {
			// Create many posts to test batch processing
			const manyPosts = [];
			for (let i = 0; i < 10; i++) {
				const post = await posts.create({
					uid: testUid,
					tid: topicData.tid,
					content: `Batch test post ${i}`,
				});
				manyPosts.push(post);
			}

			// Remove anonymous field from these posts to simulate pre-upgrade state
			for (const post of manyPosts) {
				await db.deleteObjectField(`post:${post.pid}`, 'anonymous');
			}

			// Run upgrade script
			const mockProgress = {
				total: 0,
				incr: function(count) {
				}
			};
			await upgradeScript.method.bind({ progress: mockProgress })();

			// Verify all posts now have anonymous field
			for (const post of manyPosts) {
				const postData = await db.getObject(`post:${post.pid}`);
				assert(postData.hasOwnProperty('anonymous'));
				assert.strictEqual(parseInt(postData.anonymous), 0);
			}
		});
	});

	describe('Integration with posts module', () => {
		it('should work with posts.getPostData after upgrade', async () => {
			const postData = await posts.getPostData(postData1.pid);
			assert(postData);
			assert.strictEqual(parseInt(postData.anonymous), 0);
		});

		it('should work with posts.getPostsData after upgrade', async () => {
			const postsData = await posts.getPostsData([postData1.pid, postData2.pid, postData3.pid]);
			assert.strictEqual(postsData.length, 3);
			postsData.forEach(post => {
				assert.strictEqual(parseInt(post.anonymous), 0);
			});
		});

		it('should work with posts.getPostField after upgrade', async () => {
			const anonymousField = await posts.getPostField(postData1.pid, 'anonymous');
			assert.strictEqual(parseInt(anonymousField), 0);
		});
	});
});
