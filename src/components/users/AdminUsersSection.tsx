import { ReactNode } from "react";
import { DefaultTable, DefaultTableColumn } from "../DefaultTable";

interface AdminUserRow {
  id: number;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
  updatedAt?: string | null;
}

interface AdminUsersSectionProps {
  adminUsers: AdminUserRow[];
  onOpenCreateUserModal: () => void;
  onOpenEditUserModal: (entry: AdminUserRow) => void;
  userModal: ReactNode;
  userDetailsModal: ReactNode;
}

export function AdminUsersSection({
  adminUsers,
  onOpenCreateUserModal,
  onOpenEditUserModal,
  userModal,
  userDetailsModal,
}: AdminUsersSectionProps) {
  const formatLastOnline = (value?: string | null) => {
    if (!value) return "Sin registro";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin registro";

    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const userColumns: DefaultTableColumn<AdminUserRow>[] = [
    {
      key: "name",
      label: "Nombre",
      sortable: true,
      sortValue: (entry) => entry.name,
      render: (entry) => entry.name,
    },
    {
      key: "username",
      label: "Usuario",
      sortable: true,
      sortValue: (entry) => entry.username,
      render: (entry) => `@${entry.username}`,
    },
    {
      key: "email",
      label: "Correo",
      sortable: true,
      sortValue: (entry) => entry.email,
      render: (entry) => entry.email,
    },
    {
      key: "roleName",
      label: "Rol",
      sortable: true,
      sortValue: (entry) => entry.roleName,
      render: (entry) => entry.roleName,
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      sortValue: (entry) => (entry.isActive ? 1 : 0),
      render: (entry) => (
        <span className={`pill ${entry.isActive ? "active" : "inactive"}`}>
          {entry.isActive ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (entry) => (
        <div className="table-actions">
          {entry.username !== "admin" && (
            <button type="button" onClick={() => onOpenEditUserModal(entry)}>
              Editar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="box admin-box">
      <div className="admin-header">
        <div>
          <h2>Administracion de usuarios</h2>
          <p>Gestiona todas las cuentas de usuario del sistema.</p>
        </div>
      </div>

      <article className="principal-panel">
        <h3>Usuarios del sistema</h3>
        <DefaultTable
          columns={userColumns}
          rows={adminUsers}
          getRowId={(entry) => entry.id}
          getSearchText={(entry) =>
            `${entry.name} ${entry.username} ${entry.email} ${entry.roleName}`
          }
          emptyMessage="No hay usuarios registrados."
          searchPlaceholder="Buscar por nombre, usuario o correo"
          onAdd={onOpenCreateUserModal}
          addButtonLabel="Nuevo usuario"
          exportTitle="Usuarios del sistema"
          exportFileName="usuarios-sistema"
          exportColumns={[
            {
              label: "#",
              value: (_entry, rowNumber) => rowNumber,
            },
            {
              label: "Nombre",
              value: (entry) => entry.name,
            },
            {
              label: "Usuario",
              value: (entry) => `@${entry.username}`,
            },
            {
              label: "Correo",
              value: (entry) => entry.email,
            },
            {
              label: "Rol",
              value: (entry) => entry.roleName,
            },
            {
              label: "Activo",
              value: (entry) => (entry.isActive ? "Activo" : "No activo"),
            },
            {
              label: "Última conexión",
              value: (entry) => formatLastOnline(entry.updatedAt),
            },
          ]}
        />
      </article>
      {userModal}
      {userDetailsModal}
    </section>
  );
}
