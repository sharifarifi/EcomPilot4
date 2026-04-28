"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = exports.adminApp = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const createApp = () => {
    if ((0, app_1.getApps)().length > 0) {
        return (0, app_1.getApps)()[0];
    }
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
        return (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId,
                clientEmail,
                privateKey
            })
        });
    }
    return (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
};
exports.adminApp = createApp();
exports.adminDb = (0, firestore_1.getFirestore)(exports.adminApp);
