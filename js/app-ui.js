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
        const keys = Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value);
        localStorage.setItem(SELECTED_THEME_KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch (e) { /* ignore */ }
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

function loadThemeFixedPositionsFromStorage() {
    try {
        const s = localStorage.getItem(THEME_FIXED_POSITION_STORAGE_KEY);
        if (!s) return;
        const o = JSON.parse(s);
        if (o && typeof o === 'object') themeFixedPositionByKey = o;
    } catch (e) { /* ignore */ }
}

function saveThemeFixedPositionsToStorage() {
    try {
        localStorage.setItem(THEME_FIXED_POSITION_STORAGE_KEY, JSON.stringify(themeFixedPositionByKey));
    } catch (e) { /* ignore */ }
}

function readThemeFixedPositionsFromDom() {
    const out = {};
    document.querySelectorAll('.fixed-order-pos-input').forEach(el => {
        const key = el.dataset.themeKey;
        if (!key) return;
        const v = parseInt((el.value || '').trim(), 10);
        if (Number.isFinite(v) && v >= 1) out[key] = v;
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
    enforceFiveMinuteStepOn(document.getElementById('editSlotTime'), { onEnter: () => addSlot('edit') });
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
    ['newName', 'newShop', 'newDuration', 'newSlots', 'newSlotTime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dt = document.getElementById('newDayType');
    if (dt) dt.value = '평일';
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
        document.getElementById('newDayType').value = data.dayType ?? '평일';
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
    const dayType = document.getElementById('newDayType').value;
    const duration = document.getElementById('newDuration').value;
    const slots = document.getElementById('newSlots').value;

    if (formMode === 'add') {
        const existingKeys = new Set(Object.keys(themeDB));
        const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots, dayType }, { existingKeys });
        if (!ok) {
            alert(errors.join('\n'));
            return;
        }
        const key = makeKey(normalized.name, normalized.dayType);
        const btn = document.getElementById('formSaveBtn');
        btn.textContent = '저장 중...';
        btn.disabled = true;
        try {
            const payload = {
                action: 'add',
                name: normalized.name,
                shop: normalized.shop,
                duration: normalized.duration,
                slots: normalized.slots.join(', '),
                dayType: normalized.dayType
            };
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            alert('저장되었습니다!');
            themeDB[key] = {
                name: normalized.name,
                dayType: normalized.dayType,
                shop: normalized.shop,
                duration: normalized.duration,
                slots: normalized.slots
            };
            renderThemeListFromDB();
            resetFormFields();
            const sec = document.getElementById('addSection');
            const tbtn = document.getElementById('toggleAddBtn');
            if (sec && tbtn) {
                sec.style.display = 'none';
                tbtn.innerText = '테마 등록';
            }
        } catch (e) {
            alert('저장 실패!');
        } finally {
            btn.textContent = '시트에 저장 및 새로고침';
            btn.disabled = false;
        }
    } else {
        if (!currentEditOldKey) {
            alert('수정할 테마가 선택되지 않았습니다.');
            return;
        }
        const existing = new Set(Object.keys(themeDB).filter(n => n !== currentEditOldKey));
        const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots, dayType }, { existingKeys: existing });
        if (!ok) {
            alert(errors.join('\n'));
            return;
        }
        const newKey = makeKey(normalized.name, normalized.dayType);
        const renamed = newKey !== currentEditOldKey;
        if (renamed) {
            if (excludedSlots[currentEditOldKey]) {
                excludedSlots[newKey] = excludedSlots[currentEditOldKey];
                delete excludedSlots[currentEditOldKey];
            }
            delete themeDB[currentEditOldKey];
        }
        themeDB[newKey] = {
            name: normalized.name,
            dayType: normalized.dayType,
            shop: normalized.shop,
            duration: normalized.duration,
            slots: normalized.slots
        };
        renderThemeListFromDB();
        const sec = document.getElementById('addSection');
        const tbtn = document.getElementById('toggleAddBtn');
        if (sec && tbtn) {
            sec.style.display = 'none';
            tbtn.innerText = '테마 등록';
        }
        try {
            const old = parseKey(currentEditOldKey);
            const payload = {
                action: 'update',
                oldName: old.name,
                oldDayType: old.dayType,
                name: normalized.name,
                dayType: normalized.dayType,
                shop: normalized.shop,
                duration: normalized.duration,
                slots: normalized.slots.join(', ')
            };
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        } catch (e) { /* ignore */ }
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

function viewSlots(key) {
    const t = themeDB[key];
    if (!t) return alert('해당 테마를 찾을 수 없습니다.');
    const list = (t.slots || []).join(', ');
    alert(`${t.name}·${t.dayType} (${t.shop}, ${t.duration}분)\n시간표: ${list || '없음'}`);
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

function renderSelectedThemeSummary() {
    const box = document.getElementById('selectedThemeSummary');
    if (!box) return;
    const keys = Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked'))
        .map(el => el.value)
        .filter(k => !!themeDB[k])
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
    const n = document.querySelectorAll('#themeSelector input[type="checkbox"]:checked').length;
    el.value = String(Math.max(1, n));
}

function renderThemeListFromDB() {
    const selector = document.getElementById('themeSelector');
    snapshotThemeSameGapInputs();
    const listDayTypeEl = document.getElementById('listDayType');
    const selectedDayType = normalizeDayType(listDayTypeEl ? listDayTypeEl.value : '평일');
    const prevSelected = new Set(Array.from(selector.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value));
    try {
        const raw = localStorage.getItem(SELECTED_THEME_KEYS_STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            if (Array.isArray(saved)) {
                saved.forEach(k => {
                    if (themeDB[k]) prevSelected.add(k);
                });
            }
        }
    } catch (e) { /* ignore */ }
    selector.innerHTML = '';
    const allEntries = Object.entries(themeDB).sort((a, b) => compareThemeKeys(a[0], b[0]));
    const entries = allEntries.filter(([key, data]) => normalizeDayType(data.dayType) === selectedDayType);
    let invalidCount = 0;

    const rowsMeta = [];
    entries.forEach(([key, data]) => {
        const { ok, errors } = validateTheme(
            { name: data.name, shop: data.shop, duration: data.duration, slots: data.slots, dayType: data.dayType },
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
        title.innerHTML = `${data.name} <small style="color:#94a3b8">(${data.shop}, ${data.duration}분)</small> <span class="badge">${data.dayType}</span> ${ok ? '' : `<small style='color:#ef4444'>${warn}</small>`}`;
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

    const checkedNow = Array.from(selector.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value);
    themeFixedOrderKeys = themeFixedOrderKeys.filter(k => checkedNow.includes(k) && themeDB[k]);
    Object.keys(themeFixedPositionByKey).forEach(k => {
        if (!themeFixedOrderKeys.includes(k)) delete themeFixedPositionByKey[k];
    });

    const sum = document.getElementById('consistencySummary');
    const total = entries.length;
    sum.textContent = total
        ? `${selectedDayType} 기준 총 ${total}개, 비정상 ${invalidCount}개 (비정상 항목은 선택 불가)`
        : '';

    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();

    renderManagementBar();
    syncTargetCountWithSelection();
    renderSelectedThemeSummary();
    saveSelectedThemeKeysToStorage();
    saveThemeFixedOrderToStorage();
    saveThemeFixedPositionsToStorage();
}

function renderThemeOrderPanel() {
    const wrap = document.getElementById('themeOrderPanelWrap');
    const panel = document.getElementById('themeOrderPanel');
    const addSelect = document.getElementById('fixedOrderAddSelect');
    const addBtn = document.getElementById('fixedOrderAddBtn');
    if (!wrap || !panel) return;
    const useFixed = document.getElementById('useFixedOrder')?.checked;
    wrap.style.display = useFixed ? 'block' : 'none';
    if (!useFixed) {
        panel.innerHTML = '';
        if (addSelect) addSelect.innerHTML = '';
        return;
    }

    const checked = new Set(Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value));
    const ordered = themeFixedOrderKeys.filter(k => checked.has(k) && themeDB[k]);

    if (addSelect) {
        addSelect.innerHTML = '';
        const opt0 = document.createElement('option');
        opt0.value = '';
        opt0.textContent = '순서에 넣을 테마 선택…';
        addSelect.appendChild(opt0);
        [...checked].sort(compareThemeKeys).forEach(k => {
            if (ordered.includes(k)) return;
            const d = themeDB[k];
            if (!d) return;
            const o = document.createElement('option');
            o.value = k;
            o.textContent = `${d.name} (${d.shop})`;
            addSelect.appendChild(o);
        });
        if (addBtn) addBtn.disabled = addSelect.options.length <= 1;
    }

    if (ordered.length === 0) {
        panel.innerHTML =
            '<p style="font-size:0.85rem; color:#94a3b8; margin:0;">순서를 고정할 테마만 아래에서 추가하세요. 체크만으로는 포함되지 않습니다.</p>';
        return;
    }
    panel.innerHTML = '';
    ordered.forEach((key, idx) => {
        const data = themeDB[key];
        if (!data) return;
        const posVal = Number.isFinite(parseInt(themeFixedPositionByKey[key], 10))
            ? parseInt(themeFixedPositionByKey[key], 10)
            : '';
        const row = document.createElement('div');
        row.className = 'fixed-order-row';
        row.innerHTML = `
                <span style="font-weight:700; color:#64748b; min-width:1.2rem;">${idx + 1}</span>
                <span class="order-label"><strong>${escapeHtml(data.name)}</strong> <small style="color:#94a3b8;">(${escapeHtml(data.shop)})</small></span>
                <label class="fixed-order-pos-wrap" title="비우면 상대순서만 고정, 숫자 입력 시 N번째 위치로 고정">
                    <span>위치</span>
                    <input type="number" class="fixed-order-pos-input" data-theme-key="${escapeHtml(key)}" min="1" step="1" value="${posVal}">
                </label>
                <button type="button" class="fixed-order-move" aria-label="위로">↑</button>
                <button type="button" class="fixed-order-move" aria-label="아래로">↓</button>
                <button type="button" class="fixed-order-remove" aria-label="제거">✕</button>
            `;
        const [btnUp, btnDown, btnRm] = row.querySelectorAll('button');
        const posInput = row.querySelector('.fixed-order-pos-input');
        if (posInput) {
            posInput.addEventListener('input', () => {
                const v = parseInt((posInput.value || '').trim(), 10);
                if (!Number.isFinite(v) || v < 1) delete themeFixedPositionByKey[key];
                else themeFixedPositionByKey[key] = v;
                saveThemeFixedPositionsToStorage();
            });
            posInput.addEventListener('change', () => {
                const v = parseInt((posInput.value || '').trim(), 10);
                if (!Number.isFinite(v) || v < 1) {
                    delete themeFixedPositionByKey[key];
                    posInput.value = '';
                } else {
                    themeFixedPositionByKey[key] = v;
                }
                saveThemeFixedPositionsToStorage();
            });
        }
        btnUp.onclick = () => moveThemeOrder(key, -1);
        btnDown.onclick = () => moveThemeOrder(key, 1);
        btnRm.onclick = () => removeThemeFromFixedOrder(key);
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

function removeThemeFromFixedOrder(key) {
    themeFixedOrderKeys = themeFixedOrderKeys.filter(k => k !== key);
    saveThemeFixedOrderToStorage();
    delete themeFixedPositionByKey[key];
    saveThemeFixedPositionsToStorage();
    renderThemeOrderPanel();
}

function moveThemeOrder(key, delta) {
    const checked = new Set(Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value));
    let ordered = themeFixedOrderKeys.filter(k => checked.has(k) && themeDB[k]);
    const i = ordered.indexOf(key);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= ordered.length) return;
    const t = ordered[i];
    ordered[i] = ordered[j];
    ordered[j] = t;
    themeFixedOrderKeys = [...ordered, ...themeFixedOrderKeys.filter(k => !ordered.includes(k))];
    saveThemeFixedOrderToStorage();
    renderThemeOrderPanel();
}

function onThemeSelectorChange(e) {
    if (!e.target || e.target.type !== 'checkbox') return;
    const key = e.target.value;
    if (!e.target.checked) {
        themeFixedOrderKeys = themeFixedOrderKeys.filter(k => k !== key);
        saveThemeFixedOrderToStorage();
        delete themeFixedPositionByKey[key];
        saveThemeFixedPositionsToStorage();
    }
    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();
    syncTargetCountWithSelection();
    renderSelectedThemeSummary();
    saveSelectedThemeKeysToStorage();
}

function setupFixedOrderUi() {
    document.getElementById('useFixedOrder')?.addEventListener('change', () => {
        renderThemeOrderPanel();
    });
    document.getElementById('targetCount')?.addEventListener('input', () => {
        if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();
    });
    document.getElementById('themeSelector')?.addEventListener('change', onThemeSelectorChange);
    document.getElementById('fixedOrderAddBtn')?.addEventListener('click', () => {
        const sel = document.getElementById('fixedOrderAddSelect');
        if (!sel || !sel.value) return;
        const k = sel.value;
        if (!themeFixedOrderKeys.includes(k)) themeFixedOrderKeys.push(k);
        saveThemeFixedOrderToStorage();
        renderThemeOrderPanel();
    });
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
        opt.textContent = `${t.name} · ${t.dayType} (${t.shop})`;
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
async function saveEdit() {
    formMode = 'edit';
    await saveThemeFromForm();
}
function deleteFromEdit() {
    deleteFromForm();
}

function toggleSlot(key, slot) {
    if (!excludedSlots[key]) excludedSlots[key] = new Set();
    const set = excludedSlots[key];
    if (set.has(slot)) set.delete(slot);
    else set.add(slot);
    renderThemeListFromDB();
}

async function loadThemes() {
    const selector = document.getElementById('themeSelector');
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        selector.innerHTML = '';
        themeDB = {};

        data.forEach(item => {
            const slots = normalizeSlots(item.slots);
            const duration = parseInt(item.duration, 10);
            const dayType = normalizeDayType(item.dayType);
            const name = item.name;
            const key = makeKey(name, dayType);
            themeDB[key] = { name, dayType, shop: item.shop, duration, slots };
        });
        renderThemeListFromDB();
    } catch (e) {
        selector.innerHTML = '<div class="loading-spinner">데이터를 불러오지 못했습니다.</div>';
    }
}

async function addThemeToSheet() {
    const name = document.getElementById('newName').value;
    const shop = document.getElementById('newShop').value;
    const duration = document.getElementById('newDuration').value;
    const slots = document.getElementById('newSlots').value;

    const existingNames = new Set(Object.keys(themeDB));
    const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots }, { existingKeys: existingNames });
    if (!ok) {
        alert(errors.join('\n'));
        return;
    }

    const btn = document.querySelector('#addSection .btn');
    btn.innerText = '저장 중...';
    btn.disabled = true;

    try {
        const payload = {
            action: 'add',
            name: normalized.name,
            shop: normalized.shop,
            duration: normalized.duration,
            slots: normalized.slots.join(', ')
        };
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        alert('저장되었습니다!');
        themeDB[normalized.name] = { shop: normalized.shop, duration: normalized.duration, slots: normalized.slots };
        renderThemeListFromDB();
        document.getElementById('newName').value = '';
        document.getElementById('newShop').value = '';
        document.getElementById('newDuration').value = '';
        document.getElementById('newSlots').value = '';
        renderSlotBadges('new');
        const add = document.getElementById('addSection');
        const tbtn = document.getElementById('toggleAddBtn');
        if (add && tbtn) {
            add.style.display = 'none';
            tbtn.innerText = '테마 등록';
        }
    } catch (e) {
        alert('저장 실패!');
    } finally {
        btn.innerText = '시트에 저장 및 새로고침';
        btn.disabled = false;
    }
}

async function editTheme(oldName) {
    const data = themeDB[oldName];
    if (!data) return alert('해당 테마를 찾을 수 없습니다.');
    const name = prompt('테마명', oldName);
    if (name === null) return;
    const shop = prompt('매장명', data.shop ?? '');
    if (shop === null) return;
    const duration = prompt('소요시간(분)', String(data.duration ?? ''));
    if (duration === null) return;
    const slots = prompt('시간표 (쉼표로 구분: 10:00, 11:20)', (data.slots || []).join(', '));
    if (slots === null) return;

    const existing = new Set(Object.keys(themeDB).filter(n => n !== oldName));
    const { ok, errors, normalized } = validateTheme({ name, shop, duration, slots }, { existingKeys: existing });
    if (!ok) {
        alert(errors.join('\n'));
        return;
    }

    const renamed = normalized.name !== oldName;
    if (renamed) {
        if (excludedSlots[oldName]) {
            excludedSlots[normalized.name] = excludedSlots[oldName];
            delete excludedSlots[oldName];
        }
        delete themeDB[oldName];
    }
    themeDB[normalized.name] = { shop: normalized.shop, duration: normalized.duration, slots: normalized.slots };
    renderThemeListFromDB();

    try {
        const payload = {
            action: 'update',
            oldName,
            name: normalized.name,
            shop: normalized.shop,
            duration: normalized.duration,
            slots: normalized.slots.join(', ')
        };
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) { /* ignore */ }
}

async function deleteTheme(key) {
    const t = themeDB[key];
    if (!t) return;
    if (!confirm(`'${t.name}' (${t.dayType}) 테마를 삭제하시겠습니까?`)) return;
    delete themeDB[key];
    if (excludedSlots[key]) delete excludedSlots[key];
    renderThemeListFromDB();
    try {
        const payload = { action: 'delete', name: t.name, dayType: t.dayType };
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) {}
}
