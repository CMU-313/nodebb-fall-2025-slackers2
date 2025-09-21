'use strict';

$(document).ready(function () {
	const AnonymousToggle = {
		init() {
			this.bindEvents();
			this.loadSavedState();
		},

		bindEvents() {
			$(document).on('change', '#anonymous-checkbox', this.handleToggle.bind(this));
		},

		handleToggle(e) {
			const isAnonymous = $(e.target).is(':checked');
			this.setAnonymousState(isAnonymous);
		},

		setAnonymousState(isAnonymous) {
			// Save state to localStorage for persistence
			localStorage.setItem('nodebb_anonymous_posting', isAnonymous.toString());
			
			// You can add visual feedback here if needed
			const checkbox = $('#anonymous-checkbox');
			if (isAnonymous) {
				checkbox.closest('.form-check').addClass('text-warning');
			} else {
				checkbox.closest('.form-check').removeClass('text-warning');
			}
		},

		loadSavedState() {
			const savedState = localStorage.getItem('nodebb_anonymous_posting');
			if (savedState !== null) {
				const isAnonymous = savedState === 'true';
				$('#anonymous-checkbox').prop('checked', isAnonymous);
				this.setAnonymousState(isAnonymous);
			}
		},
	};

	AnonymousToggle.init();
});
