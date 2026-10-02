export const ROLES = {
  PARENT: "parent",
  CHILD: "child",
  CONTENT: "content_manager",
  ADMIN: "admin",
};

export const roleLabels = {
  [ROLES.PARENT]: "Phụ huynh",
  [ROLES.CHILD]: "Trẻ em",
  [ROLES.CONTENT]: "Content Manager",
  [ROLES.ADMIN]: "Quản trị viên",
};

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

export function roleHome(role) {
  if (role === ROLES.CONTENT) return "/content";
  if (role === ROLES.ADMIN) return "/admin";
  // Child authentication is owned by the Mobile App; the current Web SPA
  // does not expose a Child workspace route yet.
  if (role === ROLES.CHILD) return "/";
  return "/parent";
}
