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

function renderThemeListFromDB() {
    const selector = document.getElementById('themeSelector');
    const listDayTypeEl = document.getElementById('listDayType');
    const selectedDayType = normalizeDayType(listDayTypeEl ? listDayTypeEl.value : '평일');
    const prevSelected = new Set(Array.from(selector.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value));
    selector.innerHTML = '';
    const allEntries = Object.entries(themeDB).sort((a, b) => a[0].localeCompare(b[0]));
    const entries = allEntries.filter(([key, data]) => normalizeDayType(data.dayType) === selectedDayType);
    let invalidCount = 0;
    entries.forEach(([key, data]) => {
        const { ok, errors } = validateTheme(
            { name: data.name, shop: data.shop, duration: data.duration, slots: data.slots, dayType: data.dayType },
            { allowExistingName: true }
        );
        if (!ok) invalidCount++;

        const row = document.createElement('div');
        row.className = 'theme-item';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = key;
        cb.disabled = !ok;
        if (prevSelected.has(key) && ok) cb.checked = true;
        row.appendChild(cb);

        const meta = document.createElement('div');
        meta.className = 'theme-meta';
        const title = document.createElement('div');
        const warn = ok ? '' : `(비정상: ${errors[0]})`;
        title.innerHTML = `${data.name} <small style="color:#94a3b8">(${data.shop}, ${data.duration}분)</small> <span class="badge">${data.dayType}</span> ${ok ? '' : `<small style='color:#ef4444'>${warn}</small>`}`;
        meta.appendChild(title);

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
        meta.appendChild(badges);

        row.appendChild(meta);
        selector.appendChild(row);
    });
    const checkedNow = Array.from(selector.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value);
    themeOrderPreference = themeOrderPreference.filter(k => checkedNow.includes(k) && themeDB[k]);
    checkedNow.forEach(k => {
        if (!themeOrderPreference.includes(k)) themeOrderPreference.push(k);
    });

    const sum = document.getElementById('consistencySummary');
    const total = entries.length;
    sum.textContent = total
        ? `${selectedDayType} 기준 총 ${total}개, 비정상 ${invalidCount}개 (비정상 항목은 선택 불가)`
        : '';

    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();

    renderManagementBar();
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

    const checked = new Set(Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value));
    let ordered = themeOrderPreference.filter(k => checked.has(k) && themeDB[k]);
    const tail = [...checked].filter(k => !ordered.includes(k)).sort((a, b) => a.localeCompare(b));
    ordered = [...ordered, ...tail];
    themeOrderPreference = [...ordered, ...themeOrderPreference.filter(k => !ordered.includes(k))];

    if (ordered.length === 0) {
        panel.innerHTML = '<p style="font-size:0.85rem; color:#94a3b8; margin:0;">테마를 체크하면 순서 목록이 표시됩니다.</p>';
        return;
    }
    panel.innerHTML = '';
    ordered.forEach((key, idx) => {
        const data = themeDB[key];
        if (!data) return;
        const row = document.createElement('div');
        row.className = 'fixed-order-row';
        row.innerHTML = `
                <span style="font-weight:700; color:#64748b; min-width:1.2rem;">${idx + 1}</span>
                <span class="order-label"><strong>${escapeHtml(data.name)}</strong> <small style="color:#94a3b8;">(${escapeHtml(data.shop)})</small></span>
                <button type="button" aria-label="위로">↑</button>
                <button type="button" aria-label="아래로">↓</button>
            `;
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
    const checked = new Set(Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value));
    let ordered = themeOrderPreference.filter(k => checked.has(k) && themeDB[k]);
    const tail = [...checked].filter(k => !ordered.includes(k)).sort((a, b) => a.localeCompare(b));
    ordered = [...ordered, ...tail];
    const i = ordered.indexOf(key);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= ordered.length) return;
    const t = ordered[i];
    ordered[i] = ordered[j];
    ordered[j] = t;
    themeOrderPreference = [...ordered, ...themeOrderPreference.filter(k => !ordered.includes(k))];
    renderThemeOrderPanel();
}

function onThemeSelectorChange(e) {
    if (!e.target || e.target.type !== 'checkbox') return;
    const key = e.target.value;
    if (e.target.checked) {
        if (!themeOrderPreference.includes(key)) themeOrderPreference.push(key);
    } else {
        themeOrderPreference = themeOrderPreference.filter(k => k !== key);
    }
    if (document.getElementById('useFixedOrder')?.checked) renderThemeOrderPanel();
}

function setupFixedOrderUi() {
    document.getElementById('useFixedOrder')?.addEventListener('change', () => {
        renderThemeOrderPanel();
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
