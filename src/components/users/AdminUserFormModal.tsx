import { FormEvent } from "react";
import { AppModal } from "../AppModal";

interface AdminRoleOption {
  id: number;
  name: string;
}

interface AdminUserFormModalProps {
  isOpen: boolean;
  editingUserId: number | null;
  isOriginalAdminUser: boolean;
  userNameInput: string;
  userUsernameInput: string;
  userEmailInput: string;
  userPasswordInput: string;
  userRoleIdInput: number;
  userIsActiveInput: boolean;
  adminRoles: AdminRoleOption[];
  onUserNameChange: (value: string) => void;
  onUserUsernameChange: (value: string) => void;
  onUserEmailChange: (value: string) => void;
  onUserPasswordChange: (value: string) => void;
  onUserRoleIdChange: (value: number) => void;
  onUserIsActiveChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDeleteEditingUser: () => void;
}

export function AdminUserFormModal({
  isOpen,
  editingUserId,
  isOriginalAdminUser,
  userNameInput,
  userUsernameInput,
  userEmailInput,
  userPasswordInput,
  userRoleIdInput,
  userIsActiveInput,
  adminRoles,
  onUserNameChange,
  onUserUsernameChange,
  onUserEmailChange,
  onUserPasswordChange,
  onUserRoleIdChange,
  onUserIsActiveChange,
  onSubmit,
  onClose,
  onDeleteEditingUser,
}: AdminUserFormModalProps) {
  if (!isOpen) return null;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUserId ? "Editar usuario" : "Crear usuario"}
      description={
        editingUserId
          ? "Actualiza datos del usuario o elimina si no tiene registros relacionados."
          : "Completa la informacion para crear un nuevo usuario del sistema."
      }
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            Nombre
            <input
              value={userNameInput}
              onChange={(e) => onUserNameChange(e.target.value)}
              required
            />
          </label>
          <label>
            Usuario
            <input
              value={userUsernameInput}
              onChange={(e) => onUserUsernameChange(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="field-row">
          <label>
            Correo
            <input
              type="email"
              value={userEmailInput}
              onChange={(e) => onUserEmailChange(e.target.value)}
              required
            />
          </label>
          <label>
            Contrasena {editingUserId ? "(opcional)" : ""}
            <input
              type="password"
              value={userPasswordInput}
              onChange={(e) => onUserPasswordChange(e.target.value)}
              required={!editingUserId}
            />
          </label>
        </div>

        <div className="field-row">
          {!isOriginalAdminUser && (
            <label>
              Rol
              <select
                value={String(userRoleIdInput)}
                onChange={(e) => onUserRoleIdChange(Number(e.target.value))}
                required
              >
                <option value="0" disabled>
                  Selecciona un rol
                </option>
                {adminRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={userIsActiveInput}
              onChange={(e) => onUserIsActiveChange(e.target.checked)}
            />
            Usuario activo
          </label>
        </div>

        <div className="button-row user-modal-actions">
          <button type="submit">
            {editingUserId ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          {editingUserId && !isOriginalAdminUser && (
            <button
              type="button"
              className="danger"
              onClick={onDeleteEditingUser}
            >
              Eliminar usuario
            </button>
          )}
        </div>
      </form>
    </AppModal>
  );
}
