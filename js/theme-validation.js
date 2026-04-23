function normalizeSlots(slotsStr) {
    const raw = String(slotsStr || '').trim();
    if (!raw) return [];
    let s = raw
        .replace(/[，、;\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[·ㆍ]/g, ' ');
    s = s.replace(/(\d{1,2})\s*[\.:\-h시]\s*(\d{2})/g, (m, h, m2) => `${h}:${m2}`);
    const tokens = s.split(/[ ,]/).filter(Boolean);
    const times = [];
    const re = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
    tokens.forEach(t => {
        const m = t.match(re);
        if (m) times.push(`${m[1].padStart(2, '0')}:${m[2]}`);
    });
    const unique = Array.from(new Set(times));
    unique.sort((a, b) => toMinutes(a) - toMinutes(b));
    return unique;
}

function validateTheme({ name, shop, duration, slots, dayType }, options = {}) {
    const errors = [];
    const out = { name: String(name || '').trim(), shop: String(shop || '').trim() };
    out.dayType = normalizeDayType(dayType);
    const d = parseInt(duration, 10);
    if (!out.name) errors.push('테마명이 비어있습니다.');
    if (!out.shop) errors.push('매장명이 비어있습니다.');
    if (!Number.isFinite(d) || d <= 0) errors.push('소요시간은 1 이상의 정수여야 합니다.');
    out.duration = Number.isFinite(d) && d > 0 ? d : NaN;
    const normSlots = Array.isArray(slots) ? slots : normalizeSlots(slots);
    if (normSlots.length === 0) errors.push('올바른 시간표(HH:MM)가 1개 이상 필요합니다.');
    out.slots = normSlots;
    const key = makeKey(out.name, out.dayType);
    if (options && options.existingKeys) {
        const exists = options.existingKeys.has(key);
        if (exists && !options.allowExistingName) errors.push('이미 같은 이름/요일 조합이 존재합니다.');
    }
    return { ok: errors.length === 0, errors, normalized: out };
}
