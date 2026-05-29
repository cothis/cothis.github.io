function loadThemeSameGapsFromStorage() {
    try {
        const s = localStorage.getItem(THEME_SAME_GAP_STORAGE_KEY);
        if (!s) return;
        const o = JSON.parse(s);
        if (o && typeof o === 'object') themeSameGapByKey = o;
    } catch (e) { /* ignore */ }
}

function saveThemeSameGapsToStorage() {
    try {
        localStorage.setItem(THEME_SAME_GAP_STORAGE_KEY, JSON.stringify(themeSameGapByKey));
    } catch (e) { /* ignore */ }
}

/** 목록 갱신 직전 DOM 값을 themeSameGapByKey에 반영 */
function snapshotThemeSameGapInputs() {
    document.querySelectorAll('#themeSelector input.theme-same-gap-input').forEach(el => {
        const k = el.dataset.themeKey;
        if (!k) return;
        const t = el.value.trim();
        if (t === '') delete themeSameGapByKey[k];
        else {
            const v = parseInt(t, 10);
            if (Number.isFinite(v)) themeSameGapByKey[k] = v;
        }
    });
    saveThemeSameGapsToStorage();
}

/** 계산 시 사용: 빈 칸은 제외 */
function readThemeSameGapOverridesFromDom() {
    const out = {};
    document.querySelectorAll('#themeSelector input.theme-same-gap-input').forEach(el => {
        const k = el.dataset.themeKey;
        if (!k || el.disabled) return;
        const t = el.value.trim();
        if (t === '') return;
        const v = parseInt(t, 10);
        if (Number.isFinite(v)) out[k] = v;
    });
    return out;
}

function saveSelectedThemeKeysToStorage() {
    try {
        selectedThemeKeysInMemory = getSelectedThemeKeysFromDom();
        localStorage.removeItem(SELECTED_THEME_KEYS_STORAGE_KEY);
    } catch (e) { /* ignore */ }
}

function clearStoredSelectedThemeKeys() {
    try {
        localStorage.removeItem(SELECTED_THEME_KEYS_STORAGE_KEY);
    } catch (e) { /* ignore */ }
}

function isSelectableThemeKey(key) {
    const data = themeDB[key];
    if (!data) return false;
    return validateTheme(
        { name: data.name, shop: data.shop, duration: data.duration, slots: data.slots, registrant: data.registrant },
        { allowExistingName: true }
    ).ok;
}

function getSelectedThemeKeysFromDom() {
    const keys = new Set(selectedThemeKeysInMemory);
    document.querySelectorAll('#themeSelector input[type="checkbox"]').forEach(el => {
        if (el.checked) keys.add(el.value);
        else keys.delete(el.value);
    });
    return [...keys].filter(isSelectableThemeKey);
}

function getSelectedThemeKeys() {
    return getSelectedThemeKeysFromDom();
}

function loadThemeListSortFromStorage() {
    try {
        const v = localStorage.getItem(THEME_LIST_SORT_STORAGE_KEY);
        if (v !== 'shop' && v !== 'name') return;
        const el = document.getElementById('themeListSort');
        if (el) el.value = v;
    } catch (e) { /* ignore */ }
}

function saveThemeListSortToStorage() {
    try {
        const el = document.getElementById('themeListSort');
        if (!el) return;
        const v = el.value;
        if (v === 'shop' || v === 'name') localStorage.setItem(THEME_LIST_SORT_STORAGE_KEY, v);
    } catch (e) { /* ignore */ }
}

function loadThemeFixedOrderFromStorage() {
    try {
        const s = localStorage.getItem(THEME_FIXED_ORDER_STORAGE_KEY);
        if (!s) return;
        const a = JSON.parse(s);
        if (Array.isArray(a)) themeFixedOrderKeys = a.filter(k => typeof k === 'string');
    } catch (e) { /* ignore */ }
}

function saveThemeFixedOrderToStorage() {
    try {
        localStorage.setItem(THEME_FIXED_ORDER_STORAGE_KEY, JSON.stringify(themeFixedOrderKeys));
    } catch (e) { /* ignore */ }
}

function loadThemeFixedOrderEnabledFromStorage() {
    try {
        const s = localStorage.getItem(THEME_FIXED_ORDER_ENABLED_STORAGE_KEY);
        if (!s) {
            // 신규 진입 시 기존 themeFixedOrderKeys를 활성 키로 초기화 (하위 호환)
            themeFixedOrderEnabledKeys = [...themeFixedOrderKeys];
            return;
        }
        const a = JSON.parse(s);
        if (Array.isArray(a)) themeFixedOrderEnabledKeys = a.filter(k => typeof k === 'string');
    } catch (e) { /* ignore */ }
}

function saveThemeFixedOrderEnabledToStorage() {
    try {
        localStorage.setItem(THEME_FIXED_ORDER_ENABLED_STORAGE_KEY, JSON.stringify(themeFixedOrderEnabledKeys));
    } catch (e) { /* ignore */ }
}

function readThemeFixedPositionsFromState() {
    const out = {};
    const selected = new Set(getSelectedThemeKeys());
    const enabled = new Set(themeFixedOrderEnabledKeys);
    const ordered = themeFixedOrderKeys.filter(k => selected.has(k) && themeDB[k]);

    ordered.forEach((key, idx) => {
        if (enabled.has(key)) out[key] = idx + 1;
    });
    return out;
}

var START_TIME_KEY = 'epp.startTime';
function saveStartTime() {
    try {
        const el = document.getElementById('startTime');
        if (!el || !el.value) return;
        localStorage.setItem(START_TIME_KEY, el.value);
    } catch (e) { /* storage disabled */ }
}
function restoreStartTime() {
    try {
        const saved = localStorage.getItem(START_TIME_KEY);
        if (!saved) return;
        if (!isValidTimeStr(saved)) return;
        const el = document.getElementById('startTime');
        if (el) el.value = saved;
    } catch (e) { /* ignore */ }
}

function saveRegistrant() {
    try {
        const el = document.getElementById('newRegistrant');
        if (!el) return;
        localStorage.setItem(REGISTRANT_STORAGE_KEY, el.value || '');
    } catch (e) { /* storage disabled */ }
}
function restoreRegistrant() {
    try {
        const saved = localStorage.getItem(REGISTRANT_STORAGE_KEY);
        if (saved === null) return;
        const el = document.getElementById('newRegistrant');
        if (el) el.value = saved;
    } catch (e) { /* ignore */ }
}
function setupRegistrantPersistence() {
    restoreRegistrant();
    const el = document.getElementById('newRegistrant');
    if (el) {
        el.addEventListener('change', saveRegistrant);
        el.addEventListener('input', saveRegistrant);
    }
}

function normalizeRegistrantValue(value) {
    const text = String(value || '').trim();
    return text || '아마탱';
}

var MEAL_ENABLED_KEY = 'epp.mealEnabled';
var MEAL_START_KEY = 'epp.mealStart';
var MEAL_END_KEY = 'epp.mealEnd';
var MEAL_BREAK_MIN_KEY = 'epp.mealBreakMin';

function saveMealSettings() {
    try {
        const en = document.getElementById('mealEnabled');
        const ms = document.getElementById('mealStart');
        const me = document.getElementById('mealEnd');
        const mb = document.getElementById('mealBreakMinutes');
        if (en) localStorage.setItem(MEAL_ENABLED_KEY, en.checked ? '1' : '0');
        if (ms && ms.value && isValidTimeStr(ms.value)) localStorage.setItem(MEAL_START_KEY, ms.value);
        if (me && me.value && isValidTimeStr(me.value)) localStorage.setItem(MEAL_END_KEY, me.value);
        if (mb && mb.value !== '') localStorage.setItem(MEAL_BREAK_MIN_KEY, mb.value);
    } catch (e) { /* ignore */ }
}
function restoreMealSettings() {
    try {
        const en = document.getElementById('mealEnabled');
        const ms = document.getElementById('mealStart');
        const me = document.getElementById('mealEnd');
        const mb = document.getElementById('mealBreakMinutes');
        const savedEn = localStorage.getItem(MEAL_ENABLED_KEY);
        const savedS = localStorage.getItem(MEAL_START_KEY);
        const savedE = localStorage.getItem(MEAL_END_KEY);
        const savedBr = localStorage.getItem(MEAL_BREAK_MIN_KEY);
        if (en && savedEn !== null) en.checked = savedEn === '1';
        if (ms && savedS && isValidTimeStr(savedS)) ms.value = savedS;
        if (me && savedE && isValidTimeStr(savedE)) me.value = savedE;
        if (mb && savedBr !== null && savedBr !== '') mb.value = savedBr;
    } catch (e) { /* ignore */ }
    syncMealRowUi();
}
function syncMealRowUi() {
    const en = document.getElementById('mealEnabled');
    const row = document.getElementById('mealRangeRow');
    if (!en || !row) return;
    const on = en.checked;
    row.style.opacity = on ? '1' : '0.5';
    row.style.pointerEvents = on ? 'auto' : 'none';
}
function setupMealUi() {
    restoreMealSettings();
    const en = document.getElementById('mealEnabled');
    if (en) en.addEventListener('change', () => { syncMealRowUi(); saveMealSettings(); });
    ['mealStart', 'mealEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', saveMealSettings);
            el.addEventListener('input', saveMealSettings);
        }
    });
    const mealBr = document.getElementById('mealBreakMinutes');
    if (mealBr) {
        mealBr.addEventListener('change', saveMealSettings);
        mealBr.addEventListener('input', saveMealSettings);
    }
    syncMealRowUi();
}

function setupStartTimePersistence() {
    restoreStartTime();
    const el = document.getElementById('startTime');
    if (el) {
        el.addEventListener('change', saveStartTime);
        el.addEventListener('input', saveStartTime);
    }
}

function setupFiveMinuteEnforcement() {
    enforceFiveMinuteStepOn(document.getElementById('startTime'));
    enforceFiveMinuteStepOn(document.getElementById('newSlotTime'), { onEnter: () => addSlot('new') });
    enforceFiveMinuteStepOn(document.getElementById('mealStart'));
    enforceFiveMinuteStepOn(document.getElementById('mealEnd'));
}

function toggleAddSection() {
    const sec = document.getElementById('addSection');
    const btn = document.getElementById('toggleAddBtn');
    if (!sec || !btn) return;
    const visible = sec.style.display !== 'none';
    if (visible) {
        sec.style.display = 'none';
        btn.innerText = '테마 등록';
    } else {
        setFormMode('add');
        sec.style.display = 'block';
        btn.innerText = '테마 등록 닫기';
        document.getElementById('newName')?.focus();
    }
}
function toggleManageBar() {
    const sec = document.getElementById('manageBar');
    const btn = document.getElementById('toggleManageBtn');
    if (!sec || !btn) return;
    const visible = sec.style.display !== 'none';
    sec.style.display = visible ? 'none' : 'block';
    btn.innerText = visible ? '테마 수정' : '테마 수정 닫기';
    if (!visible) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function uniqSortTimes(arr) {
    const a = Array.from(new Set((arr || []).filter(isValidTimeStr)));
    a.sort((x, y) => toMinutes(x) - toMinutes(y));
    return a;
}
function getSlotsFromInput(prefix) {
    const val = document.getElementById(prefix + 'Slots')?.value || '';
    return normalizeSlots(val);
}
function setSlotsToInput(prefix, arr) {
    const el = document.getElementById(prefix + 'Slots');
    if (el) el.value = uniqSortTimes(arr).join(' ');
}
function renderSlotBadges(prefix) {
    const wrap = document.getElementById(prefix + 'SlotBadges');
    if (!wrap) return;
    const list = getSlotsFromInput(prefix);
    wrap.innerHTML = '';
    list.forEach(t => {
        const span = document.createElement('span');
        span.className = 'slot-badge on';
        span.title = '클릭하면 제거';
        span.textContent = t;
        span.onclick = () => removeSlot(prefix, t);
        wrap.appendChild(span);
    });
}
function addSlot(prefix) {
    const timeEl = document.getElementById(prefix + 'SlotTime');
    if (!timeEl) return;
    let t = (timeEl.value || '').trim();
    if (!isValidTimeStr(t)) {
        alert('HH:MM 형식의 시간을 선택하세요.');
        return;
    }
    t = roundTo5MinutesStr(t);
    const current = getSlotsFromInput(prefix);
    current.push(t);
    const next = uniqSortTimes(current);
    setSlotsToInput(prefix, next);
    renderSlotBadges(prefix);
    timeEl.value = '';
    timeEl.focus();
}
function applyCsv(prefix) {
    const parsed = getSlotsFromInput(prefix);
    setSlotsToInput(prefix, parsed);
    renderSlotBadges(prefix);
}
function removeSlot(prefix, t) {
    const current = getSlotsFromInput(prefix).filter(x => x !== t);
    setSlotsToInput(prefix, current);
    renderSlotBadges(prefix);
}

function resetFormFields() {
    ['newName', 'newDuration', 'newSlots', 'newSlotTime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const badgeWrap = document.getElementById('newSlotBadges');
    if (badgeWrap) badgeWrap.innerHTML = '';
}
function setFormMode(mode, key) {
    formMode = mode;
    const title = document.getElementById('formTitle');
    const saveBtn = document.getElementById('formSaveBtn');
    const delBtn = document.getElementById('formDeleteBtn');
    const toggleBtn = document.getElementById('toggleAddBtn');
    const sec = document.getElementById('addSection');
    if (mode === 'add') {
        currentEditOldKey = null;
        if (title) title.textContent = '➕ 새 테마 등록';
        if (saveBtn) saveBtn.textContent = '시트에 저장 및 새로고침';
        if (delBtn) delBtn.style.display = 'none';
        resetFormFields();
        restoreRegistrant();
        renderSlotBadges('new');
    } else if (mode === 'edit') {
        const data = themeDB[key];
        if (!data) {
            alert('해당 테마를 찾을 수 없습니다.');
            return;
        }
        currentEditOldKey = key;
        if (title) title.textContent = '✏️ 테마 수정';
        if (saveBtn) saveBtn.textContent = '수정 저장';
        if (delBtn) delBtn.style.display = 'block';
        document.getElementById('newName').value = data.name;
        document.getElementById('newShop').value = data.shop ?? '';
        const registrantEl = document.getElementById('newRegistrant');
        if (registrantEl) registrantEl.value = data.registrant ?? '';
        document.getElementById('newDuration').value = data.duration ?? '';
        document.getElementById('newSlots').value = (data.slots || []).join(' ');
        renderSlotBadges('new');
    }
    if (sec) sec.style.display = 'block';
    if (toggleBtn) toggleBtn.innerText = '폼 닫기';
    sec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveThemeFromForm() {
    const name = document.getElementById('newName').value;
    const shop = document.getElementById('newShop').value;
    const registrant = document.getElementById('newRegistrant')?.value || '';
    const duration = document.getElementById('newDuration').value;
    const slots = document.getElementById('newSlots').value;

    if (formMode === 'add') {
        const existingKeys = new Set(Object.keys(themeDB));
        const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots, registrant }, { existingKeys, requireRegistrant: true });
        if (!ok) {
            alert(errors.join('\n'));
            return;
        }
        saveRegistrant();
        const key = makeKey(normalized.name);
        
        // 로컬 즉시 반영
        const newTheme = {
            name: normalized.name,
            shop: normalized.shop,
            registrant: normalized.registrant,
            duration: normalized.duration,
            slots: normalized.slots
        };
        themeDB[key] = newTheme;
        if (typeof setLocalOverride === 'function') setLocalOverride(key, newTheme);

        renderThemeListFromDB();
        resetFormFields();
        closeEditSection();

        try {
            const payload = {
                action: 'add',
                name: normalized.name,
                shop: normalized.shop,
                registrant: normalized.registrant,
                duration: normalized.duration,
                slots: normalized.slots.join(', ')
            };
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        } catch (e) { console.error('Sheet Sync Fail', e); }
    } else {
        if (!currentEditOldKey) return alert('수정할 테마가 선택되지 않았습니다.');
        const existing = new Set(Object.keys(themeDB).filter(n => n !== currentEditOldKey));
        const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots, registrant }, { existingKeys: existing, requireRegistrant: true });
        if (!ok) {
            alert(errors.join('\n'));
            return;
        }
        saveRegistrant();
        
        const newKey = makeKey(normalized.name);
        const renamed = newKey !== currentEditOldKey;
        
        if (renamed) {
            delete themeDB[currentEditOldKey];
            if (typeof setLocalOverride === 'function') setLocalOverride(currentEditOldKey, null);
        }
        
        const updatedTheme = {
            name: normalized.name,
            shop: normalized.shop,
            registrant: normalized.registrant,
            duration: normalized.duration,
            slots: normalized.slots
        };
        themeDB[newKey] = updatedTheme;
        if (typeof setLocalOverride === 'function') setLocalOverride(newKey, updatedTheme);
        
        renderThemeListFromDB();
        closeEditSection();

        try {
            const old = parseKey(currentEditOldKey);
            const payload = {
                action: 'update',
                oldName: old.name,
                name: normalized.name,
                shop: normalized.shop,
                registrant: normalized.registrant,
                duration: normalized.duration,
                slots: normalized.slots.join(', ')
            };
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        } catch (e) { console.error('Sheet Sync Fail', e); }
        currentEditOldKey = null;
        formMode = 'add';
    }
}

function deleteFromForm() {
    if (!currentEditOldKey) {
        alert('삭제할 테마가 선택되지 않았습니다.');
        return;
    }
    const target = currentEditOldKey;
    const sec = document.getElementById('addSection');
    const tbtn = document.getElementById('toggleAddBtn');
    if (sec && tbtn) {
        sec.style.display = 'none';
        tbtn.innerText = '테마 등록';
    }
    currentEditOldKey = null;
    formMode = 'add';
    deleteTheme(target);
}

async function deleteTheme(key) {
    const t = themeDB[key];
    if (!t) return;
    if (!confirm(`'${t.name}' 테마를 삭제하시겠습니까?`)) return;
    
    delete themeDB[key];
    if (typeof setLocalOverride === 'function') setLocalOverride(key, null); 
    
    if (excludedSlots[key]) delete excludedSlots[key];
    renderThemeListFromDB();
    try {
        const payload = { action: 'delete', name: t.name };
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) { console.error('Sheet Sync Fail', e); }
}

function viewSlots(key) {
    const t = themeDB[key];
    if (!t) return alert('해당 테마를 찾을 수 없습니다.');
    const list = (t.slots || []).join(', ');
    alert(`${t.name} (${t.shop}, ${t.duration}분)\n등록자: ${t.registrant || '-'}\n시간표: ${list || '없음'}`);
}

function getThemeListSortMode() {
    const el = document.getElementById('themeListSort');
    return el && el.value === 'shop' ? 'shop' : 'name';
}

function compareThemeKeys(ka, kb) {
    const da = themeDB[ka];
    const db = themeDB[kb];
    if (!da || !db) return String(ka).localeCompare(String(kb), 'ko');
    const mode = getThemeListSortMode();
    if (mode === 'shop') {
        const c = (da.shop || '').localeCompare(db.shop || '', 'ko');
        if (c !== 0) return c;
        return (da.name || '').localeCompare(db.name || '', 'ko');
    }
    const n = (da.name || '').localeCompare(db.name || '', 'ko');
    if (n !== 0) return n;
    return String(ka).localeCompare(String(kb), 'ko');
}

function parseThemeSearchTerms(raw) {
    return String(raw || '')
        .toLowerCase()
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean);
}

function renderSelectedThemeSummary() {
    const box = document.getElementById('selectedThemeSummary');
    if (!box) return;
    const keys = getSelectedThemeKeys()
        .sort(compareThemeKeys);
    if (keys.length === 0) {
        box.innerHTML = '';
        box.style.display = 'none';
        return;
    }
    box.style.display = 'block';
    const items = keys.map(k => {
        const d = themeDB[k];
        return `<span class="selected-theme-chip"><b>${escapeHtml(d.name)}</b> <small>(${escapeHtml(d.shop)})</small></span>`;
    }).join('');
    box.innerHTML = `
        <div class="selected-theme-summary-title">선택한 테마 다시 보기 (${keys.length})</div>
        <div class="selected-theme-summary-list">${items}</div>
    `;
}

/** 선택된 테마 수와 목표 개수 입력을 맞춤 (선택 0개일 때는 최소 1) */
function syncTargetCountWithSelection() {
    const el = document.getElementById('targetCount');
    if (!el) return;
    const n = getSelectedThemeKeys().length;
    el.value = String(Math.max(1, n));
}

function renderThemeListFromDB() {
    const selector = document.getElementById('themeSelector');
    snapshotThemeSameGapInputs();
    const searchTerms = parseThemeSearchTerms(document.getElementById('themeSearchInput')?.value);

    const prevSelected = new Set(getSelectedThemeKeys());
    selector.innerHTML = '';
    const allEntries = Object.entries(themeDB).sort((a, b) => compareThemeKeys(a[0], b[0]));

    // 필터링: 검색어
    const entries = allEntries.filter(([key, data]) => {
        if (searchTerms.length === 0) return true;
        const name = (data.name || '').toLowerCase();
        const shop = (data.shop || '').toLowerCase();
        const registrant = (data.registrant || '').toLowerCase();
        return searchTerms.some(term => name.includes(term) || shop.includes(term) || registrant.includes(term));
    });

    let invalidCount = 0;

    const rowsMeta = [];
    entries.forEach(([key, data]) => {
        const { ok, errors } = validateTheme(
            { name: data.name, shop: data.shop, duration: data.duration, slots: data.slots, registrant: data.registrant },
            { allowExistingName: true }
        );
        if (!ok) invalidCount++;
        rowsMeta.push({ key, data, ok, errors });
    });

    function appendThemeRow(meta) {
        const { key, data, ok, errors } = meta;
        const row = document.createElement('div');
        row.className = 'theme-item';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = key;
        cb.disabled = !ok;
        if (prevSelected.has(key) && ok) cb.checked = true;
        row.appendChild(cb);

        const metaDiv = document.createElement('div');
        metaDiv.className = 'theme-meta';
        const title = document.createElement('div');
        const warn = ok ? '' : `(비정상: ${errors[0]})`;
        const registrantBadge = data.registrant ? ` <span class="badge">${escapeHtml(data.registrant)}</span>` : '';
        title.innerHTML = `${escapeHtml(data.name)} <small style="color:#94a3b8">(${escapeHtml(data.shop)}, ${data.duration}분)</small>${registrantBadge} ${ok ? '' : `<small style='color:#ef4444'>${escapeHtml(warn)}</small>`}`;
        metaDiv.appendChild(title);

        const badges = document.createElement('div');
        badges.className = 'slot-badges';
        const exSet = excludedSlots[key] || new Set();
        (data.slots || []).forEach(slot => {
            const span = document.createElement('span');
            const isOff = exSet.has(slot);
            span.className = `slot-badge ${isOff ? 'off' : 'on'}`;
            span.title = isOff ? '클릭하여 포함' : '클릭하여 제외';
            span.textContent = `${slot}`;
            span.onclick = () => toggleSlot(key, slot);
            badges.appendChild(span);
        });
        metaDiv.appendChild(badges);

        const gapRow = document.createElement('div');
        gapRow.className = 'theme-same-gap-row';
        const gapLabel = document.createElement('span');
        gapLabel.className = 'theme-same-gap-label';
        gapLabel.textContent = '동일매장 간격(분)';
        gapLabel.title = '직전 코스와 같은 매장일 때 적용. 비우면 위쪽 일정 설정의 동일매장 간격 기본값.';
        const gapInput = document.createElement('input');
        gapInput.type = 'number';
        gapInput.className = 'theme-same-gap-input';
        gapInput.dataset.themeKey = key;
        gapInput.step = '1';
        gapInput.autocomplete = 'off';
        gapInput.disabled = !ok;
        if (Number.isFinite(themeSameGapByKey[key])) gapInput.value = String(themeSameGapByKey[key]);
        gapInput.addEventListener('input', snapshotThemeSameGapInputs);
        gapInput.addEventListener('change', snapshotThemeSameGapInputs);
        gapRow.appendChild(gapLabel);
        gapRow.appendChild(gapInput);
        metaDiv.appendChild(gapRow);

        row.appendChild(metaDiv);
        selector.appendChild(row);
    }

    rowsMeta.forEach(appendThemeRow);

    const selectedNow = getSelectedThemeKeys();
    // 선택 해제된 테마 제거
    themeFixedOrderKeys = themeFixedOrderKeys.filter(k => selectedNow.includes(k) && themeDB[k]);
    themeFixedOrderEnabledKeys = themeFixedOrderEnabledKeys.filter(k => selectedNow.includes(k));

    // 새로 선택된 테마 추가 (순서 끝에)
    selectedNow.forEach(k => {
        if (!themeFixedOrderKeys.includes(k)) {
            themeFixedOrderKeys.push(k);
        }
    });

    const sum = document.getElementById('consistencySummary');
    const total = entries.length;
    sum.textContent = total
        ? `총 ${total}개, 비정상 ${invalidCount}개 (비정상 항목은 선택 불가)`
        : '';

    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();

    renderManagementBar();
    syncTargetCountWithSelection();
    renderSelectedThemeSummary();
    saveSelectedThemeKeysToStorage();
    saveThemeFixedOrderToStorage();
    saveThemeFixedOrderEnabledToStorage();
}

function renderThemeOrderPanel() {
    const wrap = document.getElementById('themeOrderPanelWrap');
    const panel = document.getElementById('themeOrderPanel');
    if (!wrap || !panel) return;
    const useFixed = document.getElementById('useFixedOrder')?.checked;
    wrap.style.display = useFixed ? 'block' : 'none';
    if (!useFixed) {
        panel.innerHTML = '';
        return;
    }

    const checked = new Set(getSelectedThemeKeys());
    const ordered = themeFixedOrderKeys.filter(k => checked.has(k) && themeDB[k]);

    if (ordered.length === 0) {
        panel.innerHTML =
            '<p style="font-size:0.85rem; color:#94a3b8; margin:0;">선택된 테마가 없습니다.</p>';
        return;
    }
    panel.innerHTML = '';
    ordered.forEach((key, idx) => {
        const data = themeDB[key];
        if (!data) return;
        const isEnabled = themeFixedOrderEnabledKeys.includes(key);

        const row = document.createElement('div');
        row.className = 'fixed-order-row';
        row.innerHTML = `
                <input type="checkbox" class="fixed-order-enable-cb" data-theme-key="${escapeHtml(key)}" ${isEnabled ? 'checked' : ''} style="width:auto; margin:0;">
                <span style="font-weight:700; color:#64748b; min-width:1.2rem;">${idx + 1}</span>
                <span class="order-label"><strong>${escapeHtml(data.name)}</strong> <small style="color:#94a3b8;">(${escapeHtml(data.shop)})</small></span>
                <button type="button" class="fixed-order-move" aria-label="위로">↑</button>
                <button type="button" class="fixed-order-move" aria-label="아래로">↓</button>
            `;
        
        const enableCb = row.querySelector('.fixed-order-enable-cb');
        enableCb.onchange = () => {
            if (enableCb.checked) {
                if (!themeFixedOrderEnabledKeys.includes(key)) themeFixedOrderEnabledKeys.push(key);
            } else {
                themeFixedOrderEnabledKeys = themeFixedOrderEnabledKeys.filter(k => k !== key);
            }
            saveThemeFixedOrderEnabledToStorage();
        };

        const [btnUp, btnDown] = row.querySelectorAll('button');
        btnUp.onclick = () => moveThemeOrder(key, -1);
        btnDown.onclick = () => moveThemeOrder(key, 1);
        panel.appendChild(row);
    });
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function moveThemeOrder(key, delta) {
    const i = themeFixedOrderKeys.indexOf(key);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= themeFixedOrderKeys.length) return;
    
    const t = themeFixedOrderKeys[i];
    themeFixedOrderKeys[i] = themeFixedOrderKeys[j];
    themeFixedOrderKeys[j] = t;
    
    saveThemeFixedOrderToStorage();
    renderThemeOrderPanel();
}

function onThemeSelectorChange(e) {
    if (!e.target || e.target.type !== 'checkbox') return;
    const key = e.target.value;
    if (!e.target.checked) {
        themeFixedOrderKeys = themeFixedOrderKeys.filter(k => k !== key);
        themeFixedOrderEnabledKeys = themeFixedOrderEnabledKeys.filter(k => k !== key);
        saveThemeFixedOrderToStorage();
        saveThemeFixedOrderEnabledToStorage();
    } else {
        if (!themeFixedOrderKeys.includes(key)) themeFixedOrderKeys.push(key);
        saveThemeFixedOrderToStorage();
    }
    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();
    syncTargetCountWithSelection();
    renderSelectedThemeSummary();
    saveSelectedThemeKeysToStorage();
}

function setupFixedOrderUi() {
    document.getElementById('themeSearchInput')?.addEventListener('input', renderThemeListFromDB);
    document.getElementById('useFixedOrder')?.addEventListener('change', () => {
        renderThemeOrderPanel();
    });
    document.getElementById('targetCount')?.addEventListener('input', () => {
        if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();
    });
    document.getElementById('themeSelector')?.addEventListener('change', onThemeSelectorChange);
}

async function postToSheet(payload) {
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        return true;
    } catch (e) {
        return false;
    }
}

function renderManagementBar() {
    const sel = document.getElementById('manageThemeSelect');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '';
    const keys = Object.keys(themeDB).sort((a, b) => a.localeCompare(b));
    keys.forEach(k => {
        const t = themeDB[k];
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${t.name} (${t.shop})`;
        sel.appendChild(opt);
    });
    if (prev && keys.includes(prev)) sel.value = prev;
}
function manageEdit() {
    const sel = document.getElementById('manageThemeSelect');
    if (!sel || !sel.value) return alert('수정할 테마를 선택하세요.');
    openEditSection(sel.value);
}
function manageDelete() {
    const sel = document.getElementById('manageThemeSelect');
    if (!sel || !sel.value) return alert('삭제할 테마를 선택하세요.');
    deleteTheme(sel.value);
}

function openEditSection(name) {
    setFormMode('edit', name);
}
function closeEditSection() {
    const sec = document.getElementById('addSection');
    const btn = document.getElementById('toggleAddBtn');
    if (sec && btn) {
        sec.style.display = 'none';
        btn.innerText = '테마 등록';
    }
}

function toggleSlot(key, slot) {
    if (!excludedSlots[key]) excludedSlots[key] = new Set();
    const set = excludedSlots[key];
    if (set.has(slot)) set.delete(slot);
    else set.add(slot);
    renderThemeListFromDB();
}

function getLocalOverrides() {
    try {
        const s = localStorage.getItem(THEME_OVERRIDE_STORAGE_KEY);
        return s ? JSON.parse(s) : {};
    } catch (e) { return {}; }
}

function setLocalOverride(key, data) {
    const overrides = getLocalOverrides();
    if (data === null) overrides[key] = null; // null means deleted
    else overrides[key] = data;
    localStorage.setItem(THEME_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
}

function isThemeEqual(t1, t2) {
    if (!t1 || !t2) return false;
    if (t1.name !== t2.name || t1.shop !== t2.shop || t1.duration !== t2.duration) return false;
    if ((t1.registrant || '') !== (t2.registrant || '')) return false;
    if (Array.isArray(t1.slots) && Array.isArray(t2.slots)) {
        if (t1.slots.length !== t2.slots.length) return false;
        return t1.slots.every((v, i) => v === t2.slots[i]);
    }
    return false;
}

async function loadThemes() {
    const selector = document.getElementById('themeSelector');
    try {
        // 1. data.json에서 기본 데이터 로드
        const localRes = await fetch(`data.json?v=${Date.now()}`, { cache: 'no-store' });
        const data = await localRes.json();

        selector.innerHTML = '';
        themeDB = {};

        data.forEach(item => {
            const slots = normalizeSlots(item.slots);
            const duration = parseInt(item.duration, 10);
            const name = item.name;
            const registrant = normalizeRegistrantValue(item.registrant || item.createdBy || item.author);
            const key = makeKey(name);
            themeDB[key] = { name, shop: item.shop, registrant, duration, slots };
        });

        // 로컬 데이터 먼저 표시 (빠른 피드백)
        renderThemeListFromDB();

        // 2. Apps Script에서 실시간 데이터 로드 (다른 사람이 추가한 데이터 포함)
        try {
            const remoteRes = await fetch(`${SCRIPT_URL}?v=${Date.now()}`, { cache: 'no-store' });
            if (remoteRes.ok) {
                const remoteData = await remoteRes.json();
                if (Array.isArray(remoteData)) {
                    remoteData.forEach(item => {
                        const slots = normalizeSlots(item.slots);
                        const duration = parseInt(item.duration, 10);
                        const name = item.name;
                        const registrant = normalizeRegistrantValue(item.registrant || item.createdBy || item.author);
                        const key = makeKey(name);
                        themeDB[key] = { name, shop: item.shop, registrant, duration, slots };
                    });
                }
            }
        } catch (re) {
            console.error('Remote data load failed', re);
        }

        // 3. 로컬 오버라이드 최적화 (서버 데이터와 동일하면 로컬 기록 제거)
        const overrides = getLocalOverrides();
        let changed = false;
        Object.keys(overrides).forEach(k => {
            if (k.includes('::')) {
                delete overrides[k];
                changed = true;
                return;
            }
            const ov = overrides[k];
            const base = themeDB[k];
            if (ov === null) {
                if (!base) {
                    delete overrides[k];
                    changed = true;
                }
            } else {
                if (base && isThemeEqual(ov, base)) {
                    delete overrides[k];
                    changed = true;
                }
            }
        });
        if (changed) {
            localStorage.setItem(THEME_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
        }

        // 4. 남은 로컬 오버라이드 최종 적용
        Object.keys(overrides).forEach(k => {
            if (overrides[k] === null) {
                delete themeDB[k];
            } else {
                themeDB[k] = overrides[k];
            }
        });

        // 실시간 데이터 및 오버라이드 반영하여 다시 렌더링
        renderThemeListFromDB();
    } catch (e) {
        console.error('loadThemes Error:', e);
        selector.innerHTML = '<div class="loading-spinner">데이터를 불러오지 못했습니다.</div>';
    }
}
