'use strict';

define('forum/polls', ['components', 'api', 'alerts', 'hooks'], function (components, api, alerts, hooks) {
	const Polls = {};

	Polls.init = function () {
		// Handle polls on topic pages
		const topicPollContainer = $('[component="topic/poll"]');
		if (topicPollContainer.length) {
			Polls.initTopicPolls(topicPollContainer);
		}

		// Handle polls on poll pages
		const pollPageContainer = $('.poll-container[data-poll-id]');
		if (pollPageContainer.length) {
			Polls.initPollPage(pollPageContainer);
		}
	};

	Polls.initTopicPolls = function (pollContainer) {

		// Toggle poll expand/collapse
		pollContainer.on('click', '[component="poll/toggle"]', function (e) {
			e.preventDefault();
			const pollContent = $(this).closest('[component="topic/poll"]').find('[component="poll/content"]');
			const icon = $(this).find('i');

			if (pollContent.hasClass('hidden')) {
				pollContent.removeClass('hidden');
				icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
			} else {
				pollContent.addClass('hidden');
				icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
			}
		});

		// Enable/disable vote button when option is selected
		pollContainer.on('change', 'input[type="radio"]', function () {
			const voteButton = $(this).closest('[component="topic/poll"]').find('[component="poll/vote"]');
			voteButton.prop('disabled', false);
		});

		// Handle vote submission
		pollContainer.on('click', '[component="poll/vote"]', async function (e) {
			e.preventDefault();
			const button = $(this);
			const pollContainerEl = button.closest('[component="topic/poll"]');
			const pollId = pollContainerEl.attr('data-poll-id');
			const selectedOption = pollContainerEl.find('input[type="radio"]:checked');

			if (!selectedOption.length) {
				alerts.error('[[error:no-poll-option-selected]]');
				return;
			}

			const optionId = selectedOption.val();

			try {
				button.prop('disabled', true);
				await api.post(`/polls/${pollId}/vote`, { optionId: optionId });
				await Polls.refreshPollData(pollId);
				alerts.success('[[polls:vote-submitted]]');
			} catch (err) {
				alerts.error(err.message || '[[error:vote-failed]]');
			} finally {
				button.prop('disabled', false);
			}
		});

		// Handle vote removal
		pollContainer.on('click', '[component="poll/unvote"]', async function (e) {
			e.preventDefault();
			const button = $(this);
			const pollContainerEl = button.closest('[component="topic/poll"]');
			const pollId = pollContainerEl.attr('data-poll-id');

			try {
				button.prop('disabled', true);
				await api.del(`/polls/${pollId}/vote`, {});
				await Polls.refreshPollData(pollId);
				alerts.success('[[polls:vote-removed]]');
			} catch (err) {
				alerts.error(err.message || '[[error:unvote-failed]]');
			} finally {
				button.prop('disabled', false);
			}
		});

		hooks.fire('action:polls.init', { pollContainer });
	};

	Polls.refreshPollData = async function (pollId) {
		try {
			const pollData = await api.get(`/polls/${pollId}`);
			const pollContainer = $(`[component="topic/poll"][data-poll-id="${pollId}"]`);

			if (!pollContainer.length || !pollData) {
				return;
			}

			// Update vote counts
			pollContainer.find('[component="poll/vote-count"]').text(pollData.voteCount || 0);

			// Update each option
			pollData.options.forEach(function (option) {
				const optionEl = pollContainer.find(`[data-option-id="${option.optionId}"]`);
				if (!optionEl.length) return;

				// Update vote count badge
				optionEl.find('.badge').text(option.votes || 0);

				// Calculate percentage
				const percentage = pollData.voteCount > 0 ? Math.round((option.votes / pollData.voteCount) * 100) : 0;

				// Update percentage bar and text
				optionEl.find('.poll-option-bar').css('width', percentage + '%');
				optionEl.find('.text-muted.small.text-end').text(percentage + '%');

				// Update selected state
				if (pollData.userVote && pollData.userVote.optionId === option.optionId) {
					optionEl.addClass('poll-option-selected');
					optionEl.find('input[type="radio"]').prop('checked', true);
				} else {
					optionEl.removeClass('poll-option-selected');
					optionEl.find('input[type="radio"]').prop('checked', false);
				}
			});

			// Update vote button text and state
			const voteButton = pollContainer.find('[component="poll/vote"]');
			const unvoteButton = pollContainer.find('[component="poll/unvote"]');

			if (pollData.userVote) {
				voteButton.text('[[polls:change-vote]]');
				voteButton.prop('disabled', false);
				unvoteButton.removeClass('hidden');
			} else {
				voteButton.text('[[polls:submit-vote]]');
				voteButton.prop('disabled', true);
				unvoteButton.addClass('hidden');
			}

			// Update canVote state
			if (!pollData.canVote) {
				pollContainer.find('input[type="radio"]').prop('disabled', true);
				voteButton.addClass('hidden');
				unvoteButton.addClass('hidden');
			}

			hooks.fire('action:polls.refreshed', { pollId, pollData });
		} catch (err) {
			console.error('Error refreshing poll data:', err);
		}
	};

	// Helper function to calculate percentage (also used in template)
	Polls.calculatePercentage = function (votes, total) {
		if (!total || total === 0) {
			return 0;
		}
		return Math.round((votes / total) * 100);
	};

	Polls.initPollPage = function (pollContainer) {
		// Enable/disable vote button when option is selected
		pollContainer.on('change', 'input[type="radio"]', function () {
			const voteButton = pollContainer.find('[component="poll/vote"]');
			voteButton.prop('disabled', false);
		});

		// Handle vote submission
		pollContainer.on('click', '[component="poll/vote"]', function (e) {
			e.preventDefault();
			const pollId = pollContainer.attr('data-poll-id');
			const selectedOption = pollContainer.find('input[type="radio"]:checked');

			if (!selectedOption.length) {
				return alerts.error('[[error:no-poll-option-selected]]');
			}

			const optionId = selectedOption.val();

			api.post(`/polls/${pollId}/vote`, { optionId: optionId })
				.then(() => {
					alerts.success('[[polls:vote-submitted]]');
					// Reload the page to show updated results
					window.location.reload();
				})
				.catch((err) => {
					alerts.error(err);
				});
		});
	};

	return Polls;
});