function isValidTimeStr(s) {
    if (typeof s !== 'string') return false;
    const m = s.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    return !!m;
}
function toMinutes(s) {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
}
function fromMinutes(min) {
    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

/** 로컬 기준일(2026-01-01) 위의 HH:MM */
function localDateFromHm(hhmm) {
    if (!isValidTimeStr(hhmm)) return new Date(NaN);
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(2026, 0, 1, h, m, 0, 0);
}

/** epoch ms → 로컬 HH:MM */
function formatHmFromMs(ms) {
    const d = new Date(ms);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * minStartMs 이후로 등장하는 가장 이른 시각 중, 시계가 hhmm인 인스턴트(ms).
 * 당일 같은 시각이 minStart보다 이르면 다음 날만 시도하되,
 * 그때는 새벽(06:00 미만)만 허용한다. 전날 저녁 이후에 ‘다음날 오전·낮’ 슬롯이 붙는 비현실적인 조합을 막는다.
 */
function earliestClockAtOrAfter(minStartMs, hhmm) {
    if (!isValidTimeStr(hhmm)) return NaN;
    const [hc, mc] = hhmm.split(':').map(Number);
    const slotMins = hc * 60 + mc;
    const t = new Date(minStartMs);
    t.setHours(hc, mc, 0, 0);
    const tSame = t.getTime();
    if (tSame >= minStartMs) return tSame;
    const tNext = new Date(minStartMs);
    tNext.setDate(tNext.getDate() + 1);
    tNext.setHours(hc, mc, 0, 0);
    const tNextMs = tNext.getTime();
    if (tNextMs < minStartMs) return NaN;
    if (slotMins >= 6 * 60) return NaN;
    return tNextMs;
}

function segmentEndInstantMs(startStr, endStr) {
    if (!isValidTimeStr(startStr) || !isValidTimeStr(endStr)) return 0;
    const base = new Date(2026, 0, 1);
    const s = new Date(base);
    const [sh, sm] = startStr.split(':').map(Number);
    s.setHours(sh, sm, 0, 0);
    const e = new Date(base);
    const [eh, em] = endStr.split(':').map(Number);
    e.setHours(eh, em, 0, 0);
    if (e.getTime() <= s.getTime()) e.setDate(e.getDate() + 1);
    return e.getTime();
}

/** 타임라인상 가장 늦은 종료 시각 (방문 순서와 무관) */
function scheduleEndInstantMs(schedule) {
    if (!schedule || schedule.length === 0) return 0;
    let maxEnd = 0;
    schedule.forEach(row => {
        const t = typeof row._endMs === 'number' && Number.isFinite(row._endMs)
            ? row._endMs
            : segmentEndInstantMs(row.start, row.end);
        if (Number.isFinite(t) && t > maxEnd) maxEnd = t;
    });
    return maxEnd;
}

function segmentInstantRangeMs(startStr, endStr) {
    if (!isValidTimeStr(startStr) || !isValidTimeStr(endStr)) return null;
    const base = new Date(2026, 0, 1);
    const s = new Date(base);
    const [sh, sm] = startStr.split(':').map(Number);
    s.setHours(sh, sm, 0, 0);
    const e = new Date(base);
    const [eh, em] = endStr.split(':').map(Number);
    e.setHours(eh, em, 0, 0);
    if (e.getTime() <= s.getTime()) e.setDate(e.getDate() + 1);
    return { startMs: s.getTime(), endMs: e.getTime() };
}

function mealInstantRangeMs(mealStartStr, mealEndStr) {
    const r = segmentInstantRangeMs(mealStartStr, mealEndStr);
    if (!r) return null;
    if (r.endMs <= r.startMs) return null;
    return r;
}

/** 로컬 자정(ms)인 날에 대해 밥시간 시계 구간 [winStart, winEnd] (epoch ms) */
function getMealWindowEpochForCalendarDay(dayMidnightMs, mealRange) {
    if (!mealRange) return null;
    const ds = new Date(mealRange.startMs);
    const de = new Date(mealRange.endMs);
    const sh = ds.getHours();
    const smin = ds.getMinutes();
    const eh = de.getHours();
    const emin = de.getMinutes();
    const base = new Date(dayMidnightMs);
    const y = base.getFullYear();
    const mo = base.getMonth();
    const dt = base.getDate();
    let winStart = new Date(y, mo, dt, sh, smin, 0, 0).getTime();
    let winEnd = new Date(y, mo, dt, eh, emin, 0, 0).getTime();
    if (winEnd <= winStart) {
        winEnd = new Date(y, mo, dt + 1, eh, emin, 0, 0).getTime();
    }
    return { winStart, winEnd };
}

function collectDaysTouchingSchedule(schedule) {
    const set = new Set();
    schedule.forEach(s => {
        const start = typeof s._startMs === 'number' ? s._startMs : NaN;
        const end = typeof s._endMs === 'number' ? s._endMs : NaN;
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;
        const d = new Date(start);
        d.setHours(0, 0, 0, 0);
        const last = new Date(end);
        last.setHours(0, 0, 0, 0);
        let guard = 0;
        while (d.getTime() <= last.getTime() && guard++ < 14) {
            set.add(d.getTime());
            d.setDate(d.getDate() + 1);
        }
    });
    return Array.from(set);
}

function mergeBusyIntervalsInMealWindow(schedule, winStart, winEnd) {
    const busy = [];
    schedule.forEach(s => {
        const st = typeof s._startMs === 'number' ? s._startMs : NaN;
        const en = typeof s._endMs === 'number' ? s._endMs : NaN;
        if (!Number.isFinite(st) || !Number.isFinite(en)) return;
        const a = Math.max(st, winStart);
        const b = Math.min(en, winEnd);
        if (b > a) busy.push([a, b]);
    });
    busy.sort((x, y) => x[0] - y[0]);
    const merged = [];
    busy.forEach(([a, b]) => {
        if (!merged.length || a > merged[merged.length - 1][1]) merged.push([a, b]);
        else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b);
    });
    return merged;
}

/** [winStart, winEnd] 안 테마 비구간 + mergedBusy(클립된 테마 구간 병합 결과)으로 빈 타임 구간 목록 */
function freeGapIntervalsInWindow(winStart, winEnd, mergedBusy) {
    const gaps = [];
    let prev = winStart;
    mergedBusy.forEach(([a, b]) => {
        if (a > prev) gaps.push({ startMs: prev, endMs: a });
        prev = Math.max(prev, b);
    });
    if (winEnd > prev) gaps.push({ startMs: prev, endMs: winEnd });
    return gaps.filter(g => g.endMs > g.startMs);
}

/** [winStart, winEnd] 안에서 테마가 차지하지 않는 최대 연속 길이(ms) */
function maxFreeGapMsInMealSlot(schedule, winStart, winEnd) {
    const merged = mergeBusyIntervalsInMealWindow(schedule, winStart, winEnd);
    const intervals = freeGapIntervalsInWindow(winStart, winEnd, merged);
    let maxGap = 0;
    intervals.forEach(g => {
        maxGap = Math.max(maxGap, g.endMs - g.startMs);
    });
    return maxGap;
}

/**
 * 일정이 걸치는 각 달력 날마다, 밥시간 시계 구간 안에 `breakMs` 이상 연속 빈 시간이 있어야 함(AND).
 * 예: 자정 넘어 이틀 걸치면 양쪽 날 모두 저녁 창에서 휴식이 가능해야 한다. 옛 OR 방식은
 * ‘다른 날 창은 비었다’만으로 통과해 밥창을 전부 채운 일정이 들어오는 버그가 있었다.
 */
function scheduleAllowsMealBreak(schedule, mealRange, breakMs) {
    if (!mealRange || !(breakMs > 0)) return true;
    const days = collectDaysTouchingSchedule(schedule);
    if (days.length === 0) return false;
    for (let i = 0; i < days.length; i++) {
        const win = getMealWindowEpochForCalendarDay(days[i], mealRange);
        if (!win || win.winEnd - win.winStart < breakMs) return false;
        if (maxFreeGapMsInMealSlot(schedule, win.winStart, win.winEnd) < breakMs) return false;
    }
    return true;
}

var DAY_TYPES = ['평일', '주말'];
function normalizeDayType(v) {
    const s = String(v || '').trim();
    return DAY_TYPES.includes(s) ? s : '평일';
}
function makeKey(name, dayType) {
    return `${name}::${normalizeDayType(dayType)}`;
}
function parseKey(key) {
    const i = key.lastIndexOf('::');
    if (i < 0) return { name: key, dayType: '평일' };
    return { name: key.slice(0, i), dayType: key.slice(i + 2) };
}

/**
 * PC용: `1220`→12:20, `930`→09:30, `12:5`→12:05, 두 자리 `12`→12:00·`45`→00:45 등
 * 콜론이 있으면 느슨한 HH:MM으로 해석, 숫자만이면 자리수 규칙 적용.
 */
function normalizeTimeInputString(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (s.includes(':')) {
        const parts = s.split(':');
        if (parts.length !== 2) return '';
        const hh = parseInt(parts[0].trim(), 10);
        const mm = parseInt(parts[1].trim(), 10);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '';
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return '';
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    const d = s.replace(/\D/g, '');
    if (d.length === 0) return '';
    /** 한 자리만 있으면 해석하지 않음 (입력 중 깨짐 방지) */
    if (d.length === 1) return '';
    if (d.length === 2) {
        const n = parseInt(d, 10);
        if (n <= 23) return `${String(n).padStart(2, '0')}:00`;
        if (n <= 59) return `00:${String(n).padStart(2, '0')}`;
        return '';
    }
    if (d.length === 3) {
        const n = parseInt(d, 10);
        const h = Math.floor(n / 100);
        const m = n % 100;
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        return '';
    }
    if (d.length === 4) {
        const h = parseInt(d.slice(0, 2), 10);
        const m = parseInt(d.slice(2, 4), 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        return '';
    }
    const four = d.slice(-4);
    const h = parseInt(four.slice(0, 2), 10);
    const m = parseInt(four.slice(2, 4), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return '';
}

function isFiveMinuteTime(s) {
    if (!isValidTimeStr(s)) return false;
    const mm = parseInt(s.split(':')[1], 10);
    return mm % 5 === 0;
}
function roundTo5MinutesStr(s) {
    if (!isValidTimeStr(s)) return s;
    const [hhStr, mmStr] = s.split(':');
    let hh = parseInt(hhStr, 10);
    let mm = parseInt(mmStr, 10);
    let rounded = Math.round(mm / 5) * 5;
    if (rounded === 60) {
        hh += 1;
        rounded = 0;
    }
    if (hh >= 24) {
        hh = 23;
        rounded = 55;
    }
    const H = String(hh).padStart(2, '0');
    const M = String(rounded).padStart(2, '0');
    return `${H}:${M}`;
}
/**
 * 5분 단위 보정은 포커스 아웃·change 시만 수행 (input마다 두면 타이핑 도중 깨짐).
 * 텍스트: `1220` 등은 먼저 HH:MM으로 펼친 뒤 스냅.
 * @param {Object} [options] options.onEnter: Enter 키 시 blur 대신 호출 (시간표 추가 등)
 */
function enforceFiveMinuteStepOn(el, options) {
    if (!el) return;
    const onEnterCb = options && typeof options.onEnter === 'function' ? options.onEnter : null;
    const snapIfNeeded = () => {
        if (el.type === 'time') {
            const v = (el.value || '').trim();
            if (!v) return;
            const parts = v.split(':');
            if (parts.length !== 2) return;
            const cand = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            if (!isValidTimeStr(cand)) return;
            if (!isFiveMinuteTime(cand)) {
                const snapped = roundTo5MinutesStr(cand);
                if (isValidTimeStr(snapped)) el.value = snapped;
            } else {
                el.value = cand;
            }
            return;
        }
        let v = (el.value || '').trim();
        if (!v) return;
        const expanded = normalizeTimeInputString(v);
        if (expanded) el.value = expanded;
        v = (el.value || '').trim();
        if (!isValidTimeStr(v)) return;
        if (!isFiveMinuteTime(v)) {
            const snapped = roundTo5MinutesStr(v);
            if (isValidTimeStr(snapped)) el.value = snapped;
        }
    };
    el.addEventListener('change', snapIfNeeded);
    el.addEventListener('blur', snapIfNeeded);
    el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        snapIfNeeded();
        if (onEnterCb) onEnterCb();
        else el.blur();
    });
    snapIfNeeded();
}

/** 모든 환경에서 텍스트 입력(1220 등) + 포커스 아웃 시 5분 스냅 */
const TIME_PICKER_IDS = ['startTime', 'newSlotTime', 'editSlotTime', 'mealStart', 'mealEnd'];

function applyDesktopTimeHints(el) {
    if (!el || el.type !== 'text') return;
    el.placeholder = '12:20 또는 1220';
}

function initTimePickers() {
    TIME_PICKER_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.type = 'text';
        el.removeAttribute('step');
        applyDesktopTimeHints(el);
    });
}

let _timeInputsResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(_timeInputsResizeTimer);
    _timeInputsResizeTimer = setTimeout(initTimePickers, 250);
});
