'use strict';

const nconf = require('nconf');
const categories = require('../categories');

exports.get = async function (req, res) {
	res.locals.metaTags = {
		...res.locals.metaTags,
		name: 'robots',
		content: 'noindex',
	};

	// Get all categories - for now, show all categories without privilege filtering
	// This ensures users can see categories to select from
	const categoriesList = await categories.getAllCategories();

	const data = {
		title: '[[poll:create-poll]]',
		categories: categoriesList,
	};

	// Pre-select category if provided in URL
	if (req.query.cid) {
		data.categories.forEach((category) => {
			if (category.cid == req.query.cid) {
				category.selected = true;
			}
		});
	}

	res.render('poll', data);
};

exports.post = async function (req, res) {
	const { body } = req;
	
	// For now, just redirect back to the category
	// In a real implementation, you would process the poll data here
	const cid = body.cid || 1;
	res.redirect(`${nconf.get('relative_path')}/category/${cid}`);
};

// API method for getting poll data
exports.getApi = async function (req, res) {
	try {
		// Get all categories for poll creation
		const categoriesList = await categories.getAllCategories();
		
		const data = {
			categories: categoriesList,
		};

		// Pre-select category if provided in query
		if (req.query.cid) {
			data.categories.forEach((category) => {
				if (category.cid == req.query.cid) {
					category.selected = true;
				}
			});
		}

		res.json(data);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
