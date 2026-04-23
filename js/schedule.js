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
        findSchedule(0, [], startTimeLimit, null, order, sameGap, diffGap, validResults, mealRange);
    } else {
        const combis = getCombinations(selectedKeys, targetCount);
        combis.forEach(set => {
            getPermutations(set).forEach(order => {
                findSchedule(0, [], startTimeLimit, null, order, sameGap, diffGap, validResults, mealRange);
            });
        });
    }
    renderResults(validResults);
}

function findSchedule(idx, currentSched, lastEnd, lastShop, order, sameGap, diffGap, validResults, mealRange) {
    if (idx === order.length) {
        validResults.push({ schedule: [...currentSched], endTime: lastEnd });
        return;
    }
    const key = order[idx];
    const data = themeDB[key];
    if (!data) return;
    const exSet = excludedSlots[key] || new Set();
    const activeSlots = (data.slots || []).filter(s => !exSet.has(s));
    if (activeSlots.length === 0) return;
    activeSlots.forEach(slot => {
        const gap = lastShop === data.shop ? sameGap : diffGap;
        const startDt = localDateFromHm(slot);
        const compareTime = lastEnd || document.getElementById('startTime').value;
        const prevEndPlusGap = new Date(localDateFromHm(compareTime).getTime() + (lastEnd ? gap : 0) * 60000);

        if (startDt >= prevEndPlusGap) {
            const endDt = new Date(startDt.getTime() + data.duration * 60000);
            const endTimeStr = endDt.toTimeString().slice(0, 5);
            if (mealRange && segmentOverlapsMeal(slot, endTimeStr, mealRange)) return;
            currentSched.push({ key, name: data.name, dayType: data.dayType, shop: data.shop, start: slot, end: endTimeStr });
            findSchedule(idx + 1, currentSched, endTimeStr, data.shop, order, sameGap, diffGap, validResults, mealRange);
            currentSched.pop();
        }
    });
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
    results.sort((a, b) => scheduleEndInstantMs(a.schedule) - scheduleEndInstantMs(b.schedule));
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
        res.schedule.forEach(s => {
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
