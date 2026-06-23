/**
 * Shared pure-logic utilities used by the POS / kasa front-ends.
 * Browser: load via <script src="lib/utils.js"></script> (functions become globals).
 * Node/test: const { escapeHtml, ... } = require('./lib/utils');
 */

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJsInAttr(value) {
    return escapeHtml(
        String(value == null ? '' : value)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
    );
}

function localDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function money(n) {
    return Math.round(n).toLocaleString('uk-UA');
}

function aggregateSales(sales, now) {
    const todayKey = localDateKey(now);
    const day = 24 * 60 * 60 * 1000;
    const weekCutoff = now.getTime() - 7 * day;
    const monthCutoff = now.getTime() - 30 * day;

    let todaySum = 0, todayCnt = 0;
    let weekSum = 0, weekCnt = 0;
    let monthSum = 0, monthCnt = 0;
    const perDay = {};
    const topMap = {};

    sales.forEach(function (s) {
        const t = s.tsMillis || 0;
        const tot = s.total || 0;
        if (s.dateKey === todayKey) { todaySum += tot; todayCnt++; }
        if (t >= weekCutoff) { weekSum += tot; weekCnt++; }
        if (t >= monthCutoff) { monthSum += tot; monthCnt++; }
        if (s.dateKey) {
            if (!perDay[s.dateKey]) perDay[s.dateKey] = { sum: 0, cnt: 0 };
            perDay[s.dateKey].sum += tot;
            perDay[s.dateKey].cnt++;
        }
        (s.items || []).forEach(function (it) {
            var key = it.name || it.code || '—';
            if (!topMap[key]) topMap[key] = { qty: 0, sum: 0 };
            topMap[key].qty += it.qty || 0;
            topMap[key].sum += (it.price || 0) * (it.qty || 0);
        });
    });

    return {
        todaySum: todaySum, todayCnt: todayCnt,
        weekSum: weekSum, weekCnt: weekCnt,
        monthSum: monthSum, monthCnt: monthCnt,
        perDay: perDay,
        topMap: topMap,
    };
}

function computeCart(cart, currentDiscount) {
    var subtotal = 0;
    cart.forEach(function (item) { subtotal += item.price; });
    var total = subtotal - currentDiscount;
    if (total < 0) total = 0;
    return { subtotal: subtotal, total: total };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml: escapeHtml,
        escapeJsInAttr: escapeJsInAttr,
        localDateKey: localDateKey,
        money: money,
        aggregateSales: aggregateSales,
        computeCart: computeCart,
    };
}
