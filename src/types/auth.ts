export type UserRole = "administrador" | "gerente" | "produccion" | "ventas" | "delivery";

export type Permission = {
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
};
