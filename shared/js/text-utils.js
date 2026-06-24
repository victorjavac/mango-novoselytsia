window.MangoText = {
    escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    escapeJsInAttr(value) {
        return window.MangoText.escapeHtml(String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    }
};
