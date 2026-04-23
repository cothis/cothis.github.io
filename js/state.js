/** 전역 앱 상태 (classic script 간 공유 — let/const 대신 var 사용) */
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygHe6RRs463-QPaJXASFgG0Ex0FCxEj0pDJwNksd0ST9eNXhPpbvWqgO7yOyIjM6IFOA/exec';
var themeDB = {};
var excludedSlots = {};
var themeOrderPreference = [];
var formMode = 'add';
var currentEditOldKey = null;
