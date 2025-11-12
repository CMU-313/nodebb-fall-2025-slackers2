'use strict';

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const TRANSLATOR_API = 'http://host.docker.internal:5000';
	try {
		const response = await fetch(TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content));
		const data = await response.json();
		// Return [isEnglish (boolean), translatedContent (string)]
		return [data.is_english || false, data.translated_content || postData.content];
	} catch (err) {
		// If translation fails, assume it's English and return original content
		return [true, postData.content];
	}
};