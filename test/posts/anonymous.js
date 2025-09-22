'use strict';

const assert = require('assert');

const db = require('../mocks/databasemock');
const posts = require('../../src/posts');
const topics = require('../../src/topics');
const categories = require('../../src/categories');
const user = require('../../src/user');

describe('Anonymous Posts', () => {
	let testUid;
	let testCid;
	let topicData;
	let postData;

	before(async () => {
		testUid = await user.create({ username: 'testuser' });
		({ cid: testCid } = await categories.create({
			name: 'Test Category',
			description: 'Test category for anonymous posts',
		}));
	});

	it('should create a regular post without anonymous field', async () => {
		({ topicData, postData } = await topics.post({
			uid: testUid,
			cid: testCid,
			title: 'Regular Post',
			content: 'This is a regular post',
		}));

		const post = await posts.getPostData(postData.pid);
		assert(post);
		assert.strictEqual(post.anonymous, 0);
		assert.strictEqual(post.uid, testUid);
		assert.strictEqual(post.content, 'This is a regular post');
	});

	it('should create an anonymous post with anonymous field set to 1', async () => {
		const anonymousPost = await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'This is an anonymous post',
			anonymous: 1,
		});

		assert(anonymousPost);
		assert.strictEqual(anonymousPost.anonymous, 1);
		assert.strictEqual(anonymousPost.uid, testUid);
		assert.strictEqual(anonymousPost.content, 'This is an anonymous post');

		// Verify the post was stored correctly in the database
		const storedPost = await posts.getPostData(anonymousPost.pid);
		assert.strictEqual(storedPost.anonymous, 1);
	});

	it('should create a reply with anonymous field', async () => {
		const anonymousReply = await topics.reply({
			uid: testUid,
			tid: topicData.tid,
			content: 'This is an anonymous reply',
			anonymous: 1,
		});

		assert(anonymousReply);
		assert.strictEqual(anonymousReply.anonymous, 1);
		assert.strictEqual(anonymousReply.uid, testUid);
		assert.strictEqual(anonymousReply.content, 'This is an anonymous reply');

		const storedReply = await posts.getPostData(anonymousReply.pid);
		assert.strictEqual(storedReply.anonymous, 1);
	});

	it('should handle posts without anonymous field (defaults to 0)', async () => {
		const regularReply = await topics.reply({
			uid: testUid,
			tid: topicData.tid,
			content: 'This is a regular reply',
		});

		assert(regularReply);
		assert.strictEqual(regularReply.anonymous, 0);
		assert.strictEqual(regularReply.uid, testUid);
		assert.strictEqual(regularReply.content, 'This is a regular reply');

		const storedReply = await posts.getPostData(regularReply.pid);
		assert.strictEqual(storedReply.anonymous, 0);
	});

	it('should be able to set and get anonymous field using setPostField', async () => {
		const testPost = await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Test post for field manipulation',
		});

		// Default should be 0
		assert.strictEqual(testPost.anonymous, 0);

		// Set to anonymous
		await posts.setPostField(testPost.pid, 'anonymous', 1);
		const updatedPost = await posts.getPostData(testPost.pid);
		assert.strictEqual(updatedPost.anonymous, 1);

		// Set back to non-anonymous
		await posts.setPostField(testPost.pid, 'anonymous', 0);
		const finalPost = await posts.getPostData(testPost.pid);
		assert.strictEqual(finalPost.anonymous, 0);
	});

	it('should include anonymous field when getting post fields', async () => {
		const anonymousPost = await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Test post for field retrieval',
			anonymous: 1,
		});

		// Test getting specific fields including anonymous
		const postFields = await posts.getPostFields(anonymousPost.pid, ['pid', 'uid', 'content', 'anonymous']);
		assert.strictEqual(postFields.pid, anonymousPost.pid);
		assert.strictEqual(postFields.uid, testUid);
		assert.strictEqual(postFields.content, 'Test post for field retrieval');
		assert.strictEqual(postFields.anonymous, 1);

		// Test getting just the anonymous field
		const anonymousField = await posts.getPostField(anonymousPost.pid, 'anonymous');
		assert.strictEqual(anonymousField, 1);
	});

	it('should handle multiple posts with mixed anonymous status', async () => {
		const postList = [];
		
		postList.push(await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Regular post 1',
			anonymous: 0,
		}));

		postList.push(await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Anonymous post 1',
			anonymous: 1,
		}));

		postList.push(await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Regular post 2',
		}));

		postList.push(await posts.create({
			uid: testUid,
			tid: topicData.tid,
			content: 'Anonymous post 2',
			anonymous: 1,
		}));

		// Get all posts and verify their anonymous status
		const pids = postList.map(p => p.pid);
		const allPosts = await posts.getPostsData(pids);

		assert.strictEqual(allPosts.length, 4);
		assert.strictEqual(allPosts[0].anonymous, 0);
		assert.strictEqual(allPosts[1].anonymous, 1);
		assert.strictEqual(allPosts[2].anonymous, 0);
		assert.strictEqual(allPosts[3].anonymous, 1);
	});
});
