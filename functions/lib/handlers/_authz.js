"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManagementAuth = exports.extractBearerToken = exports.HttpError = void 0;
const auth_1 = require("firebase-admin/auth");
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const rolePolicy_js_1 = require("../policies/rolePolicy.js");
class HttpError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.HttpError = HttpError;
const extractBearerToken = (req) => {
    const authorization = String(req.get('authorization') || req.get('Authorization') || '').trim();
    if (!authorization.toLowerCase().startsWith('bearer ')) {
        throw new HttpError(401, 'unauthorized', 'Missing bearer token.');
    }
    const token = authorization.slice(7).trim();
    if (!token) {
        throw new HttpError(401, 'unauthorized', 'Missing bearer token.');
    }
    return token;
};
exports.extractBearerToken = extractBearerToken;
const requireManagementAuth = async (req) => {
    const token = (0, exports.extractBearerToken)(req);
    let decoded;
    try {
        decoded = await (0, auth_1.getAuth)().verifyIdToken(token, true);
    }
    catch {
        throw new HttpError(401, 'unauthorized', 'Invalid token.');
    }
    const uid = String(decoded.uid || '').trim();
    if (!uid) {
        throw new HttpError(401, 'unauthorized', 'Invalid token uid.');
    }
    const memberSnapshot = await firebaseAdmin_js_1.adminDb.collection('team_members').doc(uid).get();
    if (!memberSnapshot.exists) {
        console.warn('[authz] team_members profile not found', { uid });
        throw new HttpError(403, 'forbidden', 'User profile not found.');
    }
    const role = (0, rolePolicy_js_1.normalizeRole)(memberSnapshot.data()?.role);
    if (!role) {
        console.warn('[authz] missing role in team_members profile', { uid });
        throw new HttpError(403, 'forbidden', 'Missing role.');
    }
    if (!rolePolicy_js_1.SHOPIFY_OPERATION_ROLES.has(role)) {
        console.warn('[authz] insufficient role for shopify operation', { uid, role });
        throw new HttpError(403, 'forbidden', 'Insufficient role.');
    }
    return { uid, role };
};
exports.requireManagementAuth = requireManagementAuth;
