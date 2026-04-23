function runCalculation() {
    const rawSelected = Array.from(document.querySelectorAll('#themeSelector input[type="checkbox"]:checked')).map(el => el.value);
    const selectedKeys = [...new Set(rawSelected)];
    const targetCount = parseInt(document.getElementById('targetCount').value, 10);
    const startTimeLimit = document.getElementById('startTime').value;
    const sameGap = Math.max(0, parseInt(document.getElementById('sameGap').value, 10) || 10);
    const diffGap = Math.max(0, parseInt(document.getElementById('diffGap').value, 10) || 25);

    if (!Number.isFinite(targetCount) || targetCount < 2 || targetCount > 4) return alert('목표 개수(2~4)가 올바르지 않습니다.');
    if (selectedKeys.length < targetCount) return alert(`최소 ${targetCount}개를 선택하세요.`);

    const mealEnabled = document.getElementById('mealEnabled')?.checked;
    const mealStartVal = document.getElementById('mealStart')?.value;
    const mealEndVal = document.getElementById('mealEnd')?.value;
    let mealRange = null;
    if (mealEnabled) {
        if (!isValidTimeStr(mealStartVal) || !isValidTimeStr(mealEndVal)) {
            return alert('밥시간을 켠 경우 시작·종료 시간을 모두 입력하세요.');
        }
        mealRange = mealInstantRangeMs(mealStartVal, mealEndVal);
        if (!mealRange) return alert('밥시간 종료는 시작보다 늦어야 합니다.');
    }

    const useFixedOrder = document.getElementById('useFixedOrder')?.checked;
    const validResults = [];

    if (useFixedOrder) {
        const checked = new Set(selectedKeys);
        let order = themeOrderPreference.filter(k => checked.has(k) && themeDB[k]);
        const missing = selectedKeys.filter(k => !order.includes(k)).sort((a, b) => a.localeCompare(b));
        order = [...order, ...missing];
        if (order.length < targetCount) {
            alert(`지정 순서 모드: 체크한 테마가 목표 개수(${targetCount})보다 적습니다. 테마를 더 선택하거나 목표 개수를 줄이세요.`);
            return;
        }
        order = order.slice(0, targetCount);
        findSchedule(0, [], null, null, order, sameGap, diffGap, validResults, mealRange);
    } else {
        const combis = getCombinations(selectedKeys, targetCount);
        combis.forEach(set => {
            getPermutations(set).forEach(order => {
                findSchedule(0, [], null, null, order, sameGap, diffGap, validResults, mealRange);
            });
        });
    }
    renderResults(validResults);
}

/**
 * lastEndMs: 직전 테마 종료 시각(epoch). 첫 테마에서는 null.
 * 첫 테마 슬롯은 기존처럼 당일(기준일)만 사용 — 시작 가능 시각보다 이른 코스는 선택되지 않음.
 * 두 번째부터는 minStartMs 이후로 슬롯 시계를 맞추며 필요 시 익일·그다음 날로 넘김(자정 넘김 후 오전 슬롯 오동작 방지).
 */
function findSchedule(idx, currentSched, lastEndMs, lastShop, order, sameGap, diffGap, validResults, mealRange) {
    if (idx === order.length) {
        const last = currentSched[currentSched.length - 1];
        const endLabel = last ? last.end : '';
        const endMsSort = typeof last?._endMs === 'number' ? last._endMs : 0;
        validResults.push({ schedule: [...currentSched], endTime: endLabel, endInstantMs: endMsSort });
        return;
    }
    const key = order[idx];
    const data = themeDB[key];
    if (!data) return;
    const exSet = excludedSlots[key] || new Set();
    const activeSlots = (data.slots || []).filter(s => !exSet.has(s));
    if (activeSlots.length === 0) return;

    const startTimeLimitMs = localDateFromHm(document.getElementById('startTime').value).getTime();
    const gapMin = idx === 0 ? 0 : lastShop === data.shop ? sameGap : diffGap;
    const minStartMs = idx === 0 ? startTimeLimitMs : lastEndMs + gapMin * 60000;

    const candidates = [];
    activeSlots.forEach(slot => {
        let startMs;
        if (idx === 0) {
            const cand = localDateFromHm(slot).getTime();
            if (cand < minStartMs) return;
            startMs = cand;
        } else {
            startMs = earliestClockAtOrAfter(minStartMs, slot);
            if (!Number.isFinite(startMs)) return;
        }
        const endMs = startMs + data.duration * 60000;
        if (mealRange && segmentOverlapsMealMs(startMs, endMs, mealRange)) return;
        candidates.push({ startMs, endMs });
    });
    candidates.sort((a, b) => a.startMs - b.startMs);

    candidates.forEach(({ startMs, endMs }) => {
        const startStr = formatHmFromMs(startMs);
        const endStr = formatHmFromMs(endMs);
        currentSched.push({
            key,
            name: data.name,
            dayType: data.dayType,
            shop: data.shop,
            start: startStr,
            end: endStr,
            _startMs: startMs,
            _endMs: endMs
        });
        findSchedule(idx + 1, currentSched, endMs, data.shop, order, sameGap, diffGap, validResults, mealRange);
        currentSched.pop();
    });
}

function scheduleSumStartMs(schedule) {
    return schedule.reduce((acc, row) => acc + (typeof row._startMs === 'number' ? row._startMs : 0), 0);
}

/** 방문 순서와 무관하게, 실제 시각 기준 오름차순 타임라인 (추천 순위용) */
function timelineStartsAscending(schedule) {
    return schedule
        .map(r => (typeof r._startMs === 'number' ? r._startMs : NaN))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
}

function compareTimelineLex(a, b) {
    const ta = timelineStartsAscending(a);
    const tb = timelineStartsAscending(b);
    const len = Math.max(ta.length, tb.length);
    for (let i = 0; i < len; i++) {
        const da = ta[i];
        const db = tb[i];
        if (da === undefined && db === undefined) return 0;
        if (da === undefined) return 1;
        if (db === undefined) return -1;
        if (da !== db) return da - db;
    }
    return 0;
}

function scheduleResultSignature(res) {
    return res.schedule.map(s => `${s.key}|${s.start}|${s.end}`).join(';');
}
function dedupeScheduleResults(results) {
    const seen = new Set();
    return results.filter(r => {
        const sig = scheduleResultSignature(r);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
    });
}

function renderResults(results) {
    results = dedupeScheduleResults(results);
    /**
     * 1) 실제 시각 타임라인을 사전순으로 이른 쪽 우선 → '늦은 밤 춘화각'이 있는 일정은
     *    종료만 조금 빨라도 1순위로 밀리지 않도록 함 (밥시간과 무관).
     * 2) 타임라인이 같으면 종료 시각 이른 순.
     * 3) 그다음 시작 합·… (세부 동률)
     */
    results.sort((a, b) => {
        const lex = compareTimelineLex(a.schedule, b.schedule);
        if (lex !== 0) return lex;
        const ae = typeof a.endInstantMs === 'number' ? a.endInstantMs : scheduleEndInstantMs(a.schedule);
        const be = typeof b.endInstantMs === 'number' ? b.endInstantMs : scheduleEndInstantMs(b.schedule);
        if (ae !== be) return ae - be;
        const sa = scheduleSumStartMs(a.schedule);
        const sb = scheduleSumStartMs(b.schedule);
        if (sa !== sb) return sa - sb;
        const na = a.schedule.filter(r => typeof r._startMs === 'number').map(r => r._startMs);
        const nb = b.schedule.filter(r => typeof r._startMs === 'number').map(r => r._startMs);
        const ma = na.length ? Math.max(...na) : 0;
        const mb = nb.length ? Math.max(...nb) : 0;
        return ma - mb;
    });
    const container = document.getElementById('resultContainer');
    if (results.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#94a3b8;'>조건에 맞는 일정이 없습니다.</p>";
        return;
    }
    container.innerHTML = `<h3 style="margin-left:5px;">검색 결과 ${results.length}건</h3>`;
    results.slice(0, 10).forEach((res, i) => {
        const card = document.createElement('div');
        card.className = 'result-item';
        let html = `<strong>추천 ${i + 1} <small>(종료 ${res.endTime})</small></strong><hr>`;
        const rows = [...res.schedule].sort((x, y) => {
            const ax = typeof x._startMs === 'number' ? x._startMs : 0;
            const ay = typeof y._startMs === 'number' ? y._startMs : 0;
            return ax - ay;
        });
        rows.forEach(s => {
            html += `<div class="schedule-row"><span class="time">${s.start}~${s.end}</span> <b>${s.name}</b> <span class="badge">${s.shop}</span> <span class="badge">${s.dayType}</span></div>`;
        });
        card.innerHTML = html;
        container.appendChild(card);
    });
}

function getCombinations(arr, n) {
    if (!Number.isFinite(n) || n < 1 || n > arr.length) return [];
    const result = [];
    function backtrack(start, combo) {
        if (combo.length === n) {
            result.push(combo.slice());
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            backtrack(i + 1, combo);
            combo.pop();
        }
    }
    backtrack(0, []);
    return result;
}

function getPermutations(arr) {
    if (arr.length <= 1) return arr.length ? [[arr[0]]] : [];
    const res = [];
    arr.forEach((fixed, idx, origin) => {
        const rest = [...origin.slice(0, idx), ...origin.slice(idx + 1)];
        getPermutations(rest).forEach(p => res.push([fixed, ...p]));
    });
    return res;
}
