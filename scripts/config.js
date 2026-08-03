'use strict';

const BASE_URL = 'https://bariksabarna.github.io/bariksabarna';
const BASE_PATH = new URL(BASE_URL).pathname.replace(/\/+$/, '') || '';

module.exports = { BASE_URL, BASE_PATH };
