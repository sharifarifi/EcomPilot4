"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSync = void 0;
const syncAll_js_1 = require("../jobs/syncAll.js");
const manualSync = async (req, res) => {
    const shopDomain = String(req.query.shop || req.body?.shop || '').trim();
    if (!shopDomain) {
        res.status(400).json({ error: 'Missing shop domain.' });
        return;
    }
    const result = await (0, syncAll_js_1.syncAll)(shopDomain);
    res.status(202).json(result);
};
exports.manualSync = manualSync;
