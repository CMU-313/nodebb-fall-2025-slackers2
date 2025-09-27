'use strict';

const assert = require('assert');
const User = require('../../src/user');
const topicsAPI = require('../../src/api/topics');
const topics = require('../../src/topics');

describe('topicsAPI.setShowPreview', () => {
	let adminUid;
	let normalUid;
	let tid;

	before(async () => {
		adminUid = await User.create({ username: 'testadmin' });
		normalUid = await User.create({ username: 'testuser' });
		// add admin to administrators group
		await require('../../src/groups').join('administrators', adminUid);

		// create a topic as admin
		const { topicData } = await topics.post({ uid: adminUid, title: 'preview test', content: 'body', cid: 1 });
		tid = topicData.tid;
	});

	it('should set showPreview for admin', async () => {
		const res = await topicsAPI.setShowPreview({ uid: adminUid }, { tid, show: true });
		assert.strictEqual(res.tid, tid);
		assert.strictEqual(res.show, true);
		const val = await topics.getTopicField(tid, 'showPreview');
		assert.strictEqual(Number(val), 1);
	});

	it('should reject non-admin users', async () => {
		try {
			await topicsAPI.setShowPreview({ uid: normalUid }, { tid, show: true });
			assert.fail('expected error');
		} catch (err) {
			assert.ok(err.message.includes('[[error:no-privileges]]'));
		}
	});
});
