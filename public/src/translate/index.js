
const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const TRANSLATOR_API = 'http://host.docker.internal:5000';
	try {
		const response = await fetch(`${TRANSLATOR_API}/?content=${encodeURIComponent(postData.content)}`);
		const data = await response.json();
		return [data.is_english || false, data.translated_content || postData.content];
	} catch (err) {
		return [false, postData.content];
	}
};