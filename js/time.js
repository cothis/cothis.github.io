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
 * 자정 넘김 후 다음 테마가 '전날 아침' 슬롯으로 잘못 잡히는 버그 방지용.
 */
function earliestClockAtOrAfter(minStartMs, hhmm) {
    if (!isValidTimeStr(hhmm)) return NaN;
    const [hc, mc] = hhmm.split(':').map(Number);
    let t = new Date(minStartMs);
    t.setHours(hc, mc, 0, 0);
    let guard = 0;
    while (t.getTime() < minStartMs && guard++ < 400) {
        t.setDate(t.getDate() + 1);
        t.setHours(hc, mc, 0, 0);
    }
    return t.getTime();
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

function scheduleEndInstantMs(schedule) {
    if (!schedule || schedule.length === 0) return 0;
    const last = schedule[schedule.length - 1];
    if (typeof last._endMs === 'number' && Number.isFinite(last._endMs)) return last._endMs;
    return segmentEndInstantMs(last.start, last.end);
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

function rangesOverlapOpen(a0, a1, b0, b1) {
    return Math.max(a0, b0) < Math.min(a1, b1);
}

/**
 * 테마 구간이 밥시간과 겹치는지. 설정상 밥창은 ‘시각’이므로 구간이 걸치는 로컬 각 날짜마다 같은 시계 구간으로 검사한다.
 */
function segmentOverlapsMealMs(startMs, endMs, mealRange) {
    if (!mealRange) return false;
    if (!(endMs > startMs)) return false;
    const ds = new Date(mealRange.startMs);
    const de = new Date(mealRange.endMs);
    const sh = ds.getHours();
    const smin = ds.getMinutes();
    const eh = de.getHours();
    const emin = de.getMinutes();
    let dayCursor = new Date(startMs);
    dayCursor.setHours(0, 0, 0, 0);
    const lastDay = new Date(endMs);
    lastDay.setHours(0, 0, 0, 0);

    let guard = 0;
    while (dayCursor.getTime() <= lastDay.getTime() && guard++ < 14) {
        const y = dayCursor.getFullYear();
        const mo = dayCursor.getMonth();
        const dt = dayCursor.getDate();
        const winStart = new Date(y, mo, dt, sh, smin, 0, 0).getTime();
        let winEnd = new Date(y, mo, dt, eh, emin, 0, 0).getTime();
        if (winEnd <= winStart) {
            winEnd = new Date(y, mo, dt + 1, eh, emin, 0, 0).getTime();
        }
        if (rangesOverlapOpen(startMs, endMs, winStart, winEnd)) return true;
        dayCursor.setDate(dayCursor.getDate() + 1);
    }
    return false;
}

function segmentOverlapsMeal(segmentStartStr, segmentEndStr, mealRange) {
    if (!mealRange) return false;
    const seg = segmentInstantRangeMs(segmentStartStr, segmentEndStr);
    if (!seg) return false;
    return rangesOverlapOpen(seg.startMs, seg.endMs, mealRange.startMs, mealRange.endMs);
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
function enforceFiveMinuteStepOn(el) {
    if (!el) return;
    el.setAttribute('step', '300');
    const handler = () => {
        const v = (el.value || '').trim();
        if (!v) return;
        if (!isValidTimeStr(v) || !isFiveMinuteTime(v)) {
            const snapped = roundTo5MinutesStr(v);
            if (isValidTimeStr(snapped)) el.value = snapped;
        }
    };
    el.addEventListener('change', handler);
    el.addEventListener('input', handler);
    el.addEventListener('blur', handler);
    handler();
}
