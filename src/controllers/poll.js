'use strict';

const nconf = require('nconf');
const categories = require('../categories');

exports.get = async function (req, res) {
	res.locals.metaTags = {
		...res.locals.metaTags,
		name: 'robots',
		content: 'noindex',
	};

	const data = {
		title: '[[poll:create-poll]]',
		categories: await categories.getCategoriesByPrivilege('cid', req.uid, 'topics:create'),
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
