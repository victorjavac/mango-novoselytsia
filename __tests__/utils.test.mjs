import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
    escapeHtml,
    escapeJsInAttr,
    localDateKey,
    money,
    aggregateSales,
    computeCart,
} = require('../lib/utils');

// ── escapeHtml ──────────────────────────────────────────────
describe('escapeHtml', () => {
    it('escapes &, <, >, ", and single-quote', () => {
        expect(escapeHtml('&<>"\''))
            .toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    it('returns empty string for null / undefined', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('coerces numbers to string', () => {
        expect(escapeHtml(42)).toBe('42');
    });

    it('leaves safe text untouched', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('handles mixed content', () => {
        expect(escapeHtml('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('handles empty string', () => {
        expect(escapeHtml('')).toBe('');
    });
});

// ── escapeJsInAttr ──────────────────────────────────────────
describe('escapeJsInAttr', () => {
    it('escapes backslash then single-quote, then HTML-encodes', () => {
        expect(escapeJsInAttr("it's a \\test"))
            .toBe("it\\&#39;s a \\\\test");
    });

    it('returns empty for null', () => {
        expect(escapeJsInAttr(null)).toBe('');
    });

    it('does not double-escape already safe strings', () => {
        expect(escapeJsInAttr('abc')).toBe('abc');
    });

    it('escapes HTML entities after JS escaping', () => {
        expect(escapeJsInAttr('<b>')).toBe('&lt;b&gt;');
    });
});

// ── localDateKey ────────────────────────────────────────────
describe('localDateKey', () => {
    it('formats a date as YYYY-MM-DD', () => {
        expect(localDateKey(new Date(2025, 0, 5))).toBe('2025-01-05');
    });

    it('zero-pads single-digit month and day', () => {
        expect(localDateKey(new Date(2024, 2, 9))).toBe('2024-03-09');
    });

    it('handles Dec 31', () => {
        expect(localDateKey(new Date(2024, 11, 31))).toBe('2024-12-31');
    });
});

// ── money ───────────────────────────────────────────────────
describe('money', () => {
    it('rounds and formats with Ukrainian locale', () => {
        const result = money(1234.56);
        expect(result).toMatch(/1[\s\u00a0.]?235/);
    });

    it('returns "0" for zero', () => {
        expect(money(0)).toBe('0');
    });

    it('rounds down .4', () => {
        expect(money(9.4)).toBe('9');
    });

    it('rounds up .5', () => {
        expect(money(9.5)).toBe('10');
    });
});

// ── aggregateSales ──────────────────────────────────────────
describe('aggregateSales', () => {
    const now = new Date(2025, 5, 20, 12, 0, 0); // 2025-06-20 12:00

    it('returns zeroes for empty array', () => {
        const r = aggregateSales([], now);
        expect(r.todaySum).toBe(0);
        expect(r.weekSum).toBe(0);
        expect(r.monthSum).toBe(0);
        expect(Object.keys(r.perDay)).toHaveLength(0);
        expect(Object.keys(r.topMap)).toHaveLength(0);
    });

    it('aggregates today sales', () => {
        const sales = [
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 100, items: [] },
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 50, items: [] },
        ];
        const r = aggregateSales(sales, now);
        expect(r.todaySum).toBe(150);
        expect(r.todayCnt).toBe(2);
    });

    it('separates week / month buckets correctly', () => {
        const day = 24 * 60 * 60 * 1000;
        const sales = [
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 10, items: [] },
            { dateKey: '2025-06-15', tsMillis: now.getTime() - 5 * day, total: 20, items: [] },
            { dateKey: '2025-05-25', tsMillis: now.getTime() - 26 * day, total: 30, items: [] },
        ];
        const r = aggregateSales(sales, now);
        expect(r.weekSum).toBe(30);  // first two within 7 days
        expect(r.monthSum).toBe(60); // all three within 30 days
    });

    it('builds perDay map', () => {
        const sales = [
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 100, items: [] },
            { dateKey: '2025-06-19', tsMillis: now.getTime() - 86400000, total: 200, items: [] },
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 50, items: [] },
        ];
        const r = aggregateSales(sales, now);
        expect(r.perDay['2025-06-20']).toEqual({ sum: 150, cnt: 2 });
        expect(r.perDay['2025-06-19']).toEqual({ sum: 200, cnt: 1 });
    });

    it('builds topMap from items', () => {
        const sales = [
            {
                dateKey: '2025-06-20', tsMillis: now.getTime(), total: 500,
                items: [
                    { name: 'Бюстгальтер', code: 'A1', price: 200, qty: 2 },
                    { name: 'Піжама', code: 'B2', price: 300, qty: 1 },
                ],
            },
        ];
        const r = aggregateSales(sales, now);
        expect(r.topMap['Бюстгальтер']).toEqual({ qty: 2, sum: 400 });
        expect(r.topMap['Піжама']).toEqual({ qty: 1, sum: 300 });
    });

    it('uses code as fallback key when name is empty', () => {
        const sales = [
            {
                dateKey: '2025-06-20', tsMillis: now.getTime(), total: 100,
                items: [{ code: 'X99', price: 100, qty: 1 }],
            },
        ];
        const r = aggregateSales(sales, now);
        expect(r.topMap['X99']).toBeDefined();
    });

    it('accumulates across multiple sales for same item', () => {
        const sales = [
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 200, items: [{ name: 'A', price: 100, qty: 1 }] },
            { dateKey: '2025-06-20', tsMillis: now.getTime(), total: 200, items: [{ name: 'A', price: 100, qty: 2 }] },
        ];
        const r = aggregateSales(sales, now);
        expect(r.topMap['A']).toEqual({ qty: 3, sum: 300 });
    });
});

// ── computeCart ─────────────────────────────────────────────
describe('computeCart', () => {
    it('sums item prices', () => {
        const cart = [
            { price: 100 },
            { price: 200 },
            { price: 50 },
        ];
        const r = computeCart(cart, 0);
        expect(r.subtotal).toBe(350);
        expect(r.total).toBe(350);
    });

    it('applies discount', () => {
        const r = computeCart([{ price: 300 }], 100);
        expect(r.subtotal).toBe(300);
        expect(r.total).toBe(200);
    });

    it('clamps total to zero when discount exceeds subtotal', () => {
        const r = computeCart([{ price: 50 }], 200);
        expect(r.total).toBe(0);
    });

    it('returns zero for empty cart', () => {
        const r = computeCart([], 0);
        expect(r.subtotal).toBe(0);
        expect(r.total).toBe(0);
    });
});
