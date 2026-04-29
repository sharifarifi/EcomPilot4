import type { Request } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../config/firebaseAdmin.js';
import { SHOPIFY_OPERATION_ROLES, normalizeRole } from '../policies/rolePolicy.js';

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const extractBearerToken = (req: Request) => {
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

export const requireManagementAuth = async (req: Request) => {
  const token = extractBearerToken(req);
  let decoded;

  try {
    decoded = await getAuth().verifyIdToken(token, true);
  } catch {
    throw new HttpError(401, 'unauthorized', 'Invalid token.');
  }

  const uid = String(decoded.uid || '').trim();
  if (!uid) {
    throw new HttpError(401, 'unauthorized', 'Invalid token uid.');
  }

  const memberSnapshot = await adminDb.collection('team_members').doc(uid).get();
  if (!memberSnapshot.exists) {
    console.warn('[authz] team_members profile not found', { uid });
    throw new HttpError(403, 'forbidden', 'User profile not found.');
  }

  const role = normalizeRole(memberSnapshot.data()?.role);
  if (!role) {
    console.warn('[authz] missing role in team_members profile', { uid });
    throw new HttpError(403, 'forbidden', 'Missing role.');
  }

  if (!SHOPIFY_OPERATION_ROLES.has(role)) {
    console.warn('[authz] insufficient role for shopify operation', { uid, role });
    throw new HttpError(403, 'forbidden', 'Insufficient role.');
  }

  return { uid, role };
};
