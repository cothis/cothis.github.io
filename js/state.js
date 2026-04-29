/** 전역 앱 상태 (classic script 간 공유 — let/const 대신 var 사용) */
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygHe6RRs463-QPaJXASFgG0Ex0FCxEj0pDJwNksd0ST9eNXhPpbvWqgO7yOyIjM6IFOA/exec';
var themeDB = {};
var excludedSlots = {};
var themeOrderPreference = [];
/** 테마 키 → 동일매장 간격(분). 목록에서 비우면 상단 기본값 사용. localStorage와 동기화 */
var themeSameGapByKey = {};
var THEME_SAME_GAP_STORAGE_KEY = 'epp.themeSameGaps';
var SELECTED_THEME_KEYS_STORAGE_KEY = 'epp.selectedThemeKeys';
var THEME_LIST_SORT_STORAGE_KEY = 'epp.themeListSort';
var formMode = 'add';
var currentEditOldKey = null;
