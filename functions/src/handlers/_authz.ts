import type { Request } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../config/firebaseAdmin.js';

const MANAGEMENT_ROLES = new Set(['ADMIN', 'MANAGER']);

const toUpperRole = (role: unknown) => String(role || '').trim().toUpperCase();

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
    throw new HttpError(403, 'forbidden', 'User profile not found.');
  }

  const role = toUpperRole(memberSnapshot.data()?.role);
  if (!MANAGEMENT_ROLES.has(role)) {
    throw new HttpError(403, 'forbidden', 'Insufficient role.');
  }

  return { uid, role };
};

