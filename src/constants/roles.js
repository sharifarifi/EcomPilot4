export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CEO: 'CEO',
  DIRECTOR: 'Director',
  PERSONNEL: 'Personel',
  EDITOR: 'Editor',
  OPERATIONS_MANAGER: 'Operations Manager'
});

export const MANAGEMENT_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.CEO,
  ROLES.DIRECTOR
]);

export const normalizeRole = (role) => String(role || '').trim().toUpperCase();

export const isManagementRole = (role) => (
  MANAGEMENT_ROLES.map(normalizeRole).includes(normalizeRole(role))
);
