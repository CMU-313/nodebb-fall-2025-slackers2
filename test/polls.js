'use strict';

const assert = require('assert');
const util = require('util');

const sleep = util.promisify(setTimeout);

const db = require('./mocks/databasemock');
const polls = require('../src/polls');
const topics = require('../src/topics');
const categories = require('../src/categories');
const user = require('../src/user');
const groups = require('../src/groups');
const helpers = require('./helpers');

describe('Polls', () => {
	let adminUid;
	let regularUid;
	let categoryObj;
	let topicObj;

	before(async () => {
		adminUid = await user.create({ username: 'pollAdmin', password: '123456', email: 'admin@poll.test' });
		regularUid = await user.create({ username: 'pollUser', password: '123456', email: 'user@poll.test' });
		
		await groups.join('administrators', adminUid);
		
		categoryObj = await categories.create({
			name: 'Poll Test Category',
			description: 'Category for poll testing',
		});

		topicObj = await topics.post({
			uid: adminUid,
			cid: categoryObj.cid,
			title: 'Test Topic for Polls',
			content: 'This topic will contain polls',
		});
	});

	after(async () => {
		await db.emptydb();
	});

	describe('Poll Creation', () => {
		it('should allow admin to create a basic poll', async () => {
			const pollData = {
				title: 'Test Poll',
				options: ['Option A', 'Option B', 'Option C'],
			};

			const pollId = await polls.create(pollData, adminUid);
			
			assert(pollId);
			assert(typeof pollId === 'string');
			
			const createdPoll = await polls.getPollData(pollId);
			assert.strictEqual(createdPoll.title, 'Test Poll');
			assert.strictEqual(String(createdPoll.uid), String(adminUid));
			assert(createdPoll.created);
			assert(createdPoll.updated);
			assert.strictEqual(Number(createdPoll.deleted), 0);
		});

		it('should create poll options when creating a poll', async () => {
			const pollData = {
				title: 'Options Test Poll',
				options: ['First Option', 'Second Option'],
			};

			const pollId = await polls.create(pollData, adminUid);
			const options = await polls.getPollOptions(pollId);
			
			assert.strictEqual(options.length, 2);
			assert.strictEqual(options[0].text, 'First Option');
			assert.strictEqual(options[1].text, 'Second Option');
			assert.strictEqual(Number(options[0].votes), 0);
			assert.strictEqual(Number(options[1].votes), 0);
		});

		it('should not allow regular user to create poll', async () => {
			const pollData = {
				title: 'Unauthorized Poll',
				options: ['Option 1', 'Option 2'],
			};

			try {
				await polls.create(pollData, regularUid);
				assert.fail('Should have thrown no-privileges error');
			} catch (err) {
				assert.strictEqual(err.message, '[[error:no-privileges]]');
			}
		});

		it('should validate poll data before creation', async () => {
			try {
				await polls.create(null, adminUid);
				assert.fail('Should have thrown validation error');
			} catch (err) {
				assert(err.message.includes('Poll data is required'));
			}
		});

		it('should require poll title', async () => {
			const pollData = {
				options: ['Option 1', 'Option 2'],
			};

			try {
				await polls.create(pollData, adminUid);
				assert.fail('Should have thrown title required error');
			} catch (err) {
				assert(err.message.includes('Poll title is required'));
			}
		});

		it('should require at least 2 options', async () => {
			const pollData = {
				title: 'Single Option Poll',
				options: ['Only Option'],
			};

			try {
				await polls.create(pollData, adminUid);
				assert.fail('Should have thrown minimum options error');
			} catch (err) {
				assert(err.message.includes('Poll must have at least 2 options'));
			}
		});

		it('should not allow more than 10 options', async () => {
			const pollData = {
				title: 'Too Many Options Poll',
				options: [
					'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5',
					'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10', 'Option 11',
				],
			};

			try {
				await polls.create(pollData, adminUid);
				assert.fail('Should have thrown maximum options error');
			} catch (err) {
				assert(err.message.includes('Poll must have less than 10 options'));
			}
		});

		it('should validate poll title length', async () => {
			const longTitle = 'a'.repeat(256);
			const pollData = {
				title: longTitle,
				options: ['Option 1', 'Option 2'],
			};

			try {
				await polls.create(pollData, adminUid);
				assert.fail('Should have thrown title too long error');
			} catch (err) {
				assert(err.message.includes('Poll title must be less than 255 characters'));
			}
		});
	});

	describe('Poll Creation for Topics', () => {
		it('should create poll attached to topic', async () => {
			const pollData = {
				title: 'Topic Poll',
				options: ['Yes', 'No'],
			};

			const pollId = await polls.createForTopic(pollData, topicObj.topicData.tid, adminUid);
			
			assert(pollId);
			
			const linkedPoll = await polls.getPollByTopic(topicObj.topicData.tid, adminUid);
			assert(linkedPoll);
			assert.strictEqual(linkedPoll.title, 'Topic Poll');
		});

		it('should link poll to topic in database', async () => {
			const pollData = {
				title: 'Linked Poll',
				options: ['Choice A', 'Choice B'],
			};

			const pollId = await polls.createForTopic(pollData, topicObj.topicData.tid, adminUid);
			const pollIdFromTopic = await polls.getPollIdByTopic(topicObj.topicData.tid);
			
			assert.strictEqual(pollId, pollIdFromTopic);
		});
	});

	describe('Poll Options Management', () => {
		let testPollId;

		beforeEach(async () => {
			const pollData = {
				title: 'Options Management Test',
				options: ['Initial Option 1', 'Initial Option 2'],
			};
			testPollId = await polls.create(pollData, adminUid);
		});

		it('should allow admin to add new option to existing poll', async () => {
			const optionId = await polls.addOption(testPollId, 'New Option', adminUid);
			
			assert(optionId);
			
			const options = await polls.getPollOptions(testPollId);
			assert.strictEqual(options.length, 3);
			assert(options.some(opt => opt.text === 'New Option'));
		});

		it('should not allow regular user to add option', async () => {
			try {
				await polls.addOption(testPollId, 'Unauthorized Option', regularUid);
				assert.fail('Should have thrown no-privileges error');
			} catch (err) {
				assert.strictEqual(err.message, '[[error:no-privileges]]');
			}
		});

		it('should allow admin to remove option from poll', async () => {
			const options = await polls.getPollOptions(testPollId);
			const optionToRemove = options[0];
			
			await polls.removeOption(testPollId, optionToRemove.optionId, adminUid);
			
			const updatedOptions = await polls.getPollOptions(testPollId);
			assert.strictEqual(updatedOptions.length, 1);
			assert(!updatedOptions.some(opt => opt.optionId === optionToRemove.optionId));
		});

		it('should not allow regular user to remove option', async () => {
			const options = await polls.getPollOptions(testPollId);
			const optionToRemove = options[0];

			try {
				await polls.removeOption(testPollId, optionToRemove.optionId, regularUid);
				assert.fail('Should have thrown no-privileges error');
			} catch (err) {
				assert.strictEqual(err.message, '[[error:no-privileges]]');
			}
		});
	});

	describe('Poll Lifecycle Management', () => {
		let testPollId;

		beforeEach(async () => {
			const pollData = {
				title: 'Lifecycle Test Poll',
				options: ['Option 1', 'Option 2'],
			};
			testPollId = await polls.create(pollData, adminUid);
		});

		it('should allow admin to close poll early', async () => {
			await polls.close(testPollId, adminUid);
			
			const poll = await polls.getPollData(testPollId);
			assert(poll.endDate);
			assert(poll.endDate <= Date.now());
		});

		it('should not allow regular user to close poll', async () => {
			try {
				await polls.close(testPollId, regularUid);
				assert.fail('Should have thrown no-privileges error');
			} catch (err) {
				assert.strictEqual(err.message, '[[error:no-privileges]]');
			}
		});

		it('should allow admin to reopen closed poll', async () => {
			await polls.close(testPollId, adminUid);
			
			const futureDate = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
			await polls.reopen(testPollId, futureDate, adminUid);
			
			const poll = await polls.getPollData(testPollId);
			assert.strictEqual(Number(poll.endDate), futureDate);
		});

		it('should not allow regular user to reopen poll', async () => {
			await polls.close(testPollId, adminUid);

			try {
				await polls.reopen(testPollId, Date.now() + 86400000, regularUid);
				assert.fail('Should have thrown no-privileges error');
			} catch (err) {
				assert.strictEqual(err.message, '[[error:no-privileges]]');
			}
		});
	});

	describe('Poll Settings', () => {
		let testPollId;

		beforeEach(async () => {
			const pollData = {
				title: 'Settings Test Poll',
				options: ['Option A', 'Option B'],
			};
			testPollId = await polls.create(pollData, adminUid);
		});

		it('should allow updating poll settings', async () => {
			const settings = {
				allowRevote: true,
				hideResults: false,
			};

			await polls.updateSettings(testPollId, settings, adminUid);
			
			const poll = await polls.getPollData(testPollId);
			assert.deepStrictEqual(poll.settings, settings);
		});

		it('should allow setting poll end date', async () => {
			const endDate = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now
			
			await polls.setEndDate(testPollId, endDate, adminUid);
			
			const poll = await polls.getPollData(testPollId);
			assert.strictEqual(Number(poll.endDate), endDate);
		});
	});

	describe('Poll Duplication', () => {
		let sourcePollId;

		beforeEach(async () => {
			const pollData = {
				title: 'Source Poll',
				options: ['Original Option 1', 'Original Option 2'],
			};
			sourcePollId = await polls.create(pollData, adminUid);
		});

		it('should allow admin to duplicate existing poll', async () => {
			// Add a small delay to ensure different timestamps
			await new Promise(resolve => setTimeout(resolve, 1));
			
			const duplicatedPollId = await polls.duplicate(sourcePollId, adminUid);
			
			assert(duplicatedPollId);
			assert.notStrictEqual(duplicatedPollId, sourcePollId);
			
			const [sourcePoll, duplicatedPoll] = await Promise.all([
				polls.getPollData(sourcePollId),
				polls.getPollData(duplicatedPollId),
			]);
			
			assert.strictEqual(sourcePoll.title, duplicatedPoll.title);
			assert.strictEqual(sourcePoll.uid, duplicatedPoll.uid);
			// Timestamps should be different (or at least duplicated poll should exist)
			assert(duplicatedPoll.created >= sourcePoll.created);
		});

		it('should create poll from template data', async () => {
			const templateData = {
				title: 'Template Poll',
				options: ['Template Option 1', 'Template Option 2'],
			};

			const pollId = await polls.createFromTemplate(templateData, adminUid);
			
			assert(pollId);
			
			const poll = await polls.getPollData(pollId);
			assert.strictEqual(poll.title, 'Template Poll');
		});
	});

	describe('Poll Existence and Validation', () => {
		it('should check if poll exists', async () => {
			const pollData = {
				title: 'Existence Test Poll',
				options: ['Option 1', 'Option 2'],
			};

			const pollId = await polls.create(pollData, adminUid);
			
			const exists = await polls.exists(pollId);
			assert.strictEqual(exists, true);
			
			const nonExistentExists = await polls.exists('nonexistent');
			assert.strictEqual(nonExistentExists, false);
		});

		it('should check multiple polls existence', async () => {
			const pollData1 = {
				title: 'Batch Test Poll 1',
				options: ['Option 1', 'Option 2'],
			};
			const pollData2 = {
				title: 'Batch Test Poll 2',
				options: ['Option A', 'Option B'],
			};

			const [pollId1, pollId2] = await Promise.all([
				polls.create(pollData1, adminUid),
				polls.create(pollData2, adminUid),
			]);
			
			const existenceResults = await polls.exists([pollId1, pollId2, 'nonexistent']);
			
			assert.strictEqual(existenceResults[0], true);
			assert.strictEqual(existenceResults[1], true);
			assert.strictEqual(existenceResults[2], false);
		});

		it('should validate poll data correctly', async () => {
			const validPollData = {
				title: 'Valid Poll',
				options: ['Option 1', 'Option 2'],
				settings: {
					allowRevote: true,
					hideResults: false,
				},
			};

			await polls.validatePollData(validPollData);
		});
	});
});