
/* eslint-disable strict */
var request = require('request');

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
 const TRANSLATOR_API = "http://host.docker.internal:5000"
 const response = await fetch(TRANSLATOR_API+'/?content='+postData.content);
 const data = await response.json();
 return ['is_english','translated_content'];
};