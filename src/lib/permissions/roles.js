export const ROLES = {
  PARENT: "parent",
  CONTENT: "content_manager",
  ADMIN: "admin",
};

export const roleLabels = {
  [ROLES.PARENT]: "Phụ huynh",
  [ROLES.CONTENT]: "Content Manager",
  [ROLES.ADMIN]: "Quản trị viên",
};

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

export function roleHome(role) {
  if (role === ROLES.CONTENT) return "/content";
  if (role === ROLES.ADMIN) return "/admin";
  return "/parent";
}
