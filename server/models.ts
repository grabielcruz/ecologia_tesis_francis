import { Sequelize, DataTypes, Model } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false,
});

export class Role extends Model {}
Role.init(
  {
    role_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Role",
    tableName: "Role",
    freezeTableName: true,
    timestamps: false,
  },
);

export class User extends Model {}
User.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Role",
        key: "role_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "User",
    freezeTableName: true,
    timestamps: false,
  },
);

export class GreenSpace extends Model {}
GreenSpace.init(
  {
    space_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_area_m2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    trees_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "GreenSpace",
    tableName: "GreenSpace",
    freezeTableName: true,
    timestamps: false,
  },
);

export class GreenSpaceReview extends Model {}
GreenSpaceReview.init(
  {
    green_space_review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    space_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GreenSpace",
        key: "space_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    review_notes: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "GreenSpaceReview",
    tableName: "GreenSpaceReview",
    freezeTableName: true,
    timestamps: false,
  },
);

export class TreeType extends Model {}
TreeType.init(
  {
    type_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    reference_images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "TreeType",
    tableName: "TreeType",
    freezeTableName: true,
    timestamps: false,
  },
);

export class TreeInventory extends Model {}
TreeInventory.init(
  {
    tree_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    health_status: {
      type: DataTypes.ENUM("healthy", "regular", "sick", "dead"),
      allowNull: false,
      defaultValue: "healthy",
    },
    space_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GreenSpace",
        key: "space_id",
      },
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "TreeType",
        key: "type_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "TreeInventory",
    tableName: "TreeInventory",
    freezeTableName: true,
    timestamps: false,
  },
);

export class ReportOfGreenArea extends Model {}
ReportOfGreenArea.init(
  {
    report_of_green_area_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    url_images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "open",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    space_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GreenSpace",
        key: "space_id",
      },
    },
  },
  {
    sequelize,
    modelName: "ReportOfGreenArea",
    tableName: "ReportOfGreenArea",
    freezeTableName: true,
    timestamps: false,
  },
);

export class ProposalOfGreenArea extends Model {}
ProposalOfGreenArea.init(
  {
    proposal_of_green_area_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "open", "closed", "approved", "rejected"),
      allowNull: false,
      defaultValue: "open",
    },
    total_votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    voting_starts: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voting_ends: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    space_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GreenSpace",
        key: "space_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ProposalOfGreenArea",
    tableName: "ProposalOfGreenArea",
    freezeTableName: true,
    timestamps: false,
  },
);

export class ProjectOfProposal extends Model {}
ProjectOfProposal.init(
  {
    project_of_proposal_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    completed_status: {
      type: DataTypes.ENUM("planned", "in_progress", "completed"),
      allowNull: false,
      defaultValue: "planned",
    },
    proposal_of_green_area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ProposalOfGreenArea",
        key: "proposal_of_green_area_id",
      },
    },
    space_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "GreenSpace",
        key: "space_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ProjectOfProposal",
    tableName: "ProjectOfProposal",
    freezeTableName: true,
    timestamps: false,
  },
);

export class ProjectUpdateOfProposal extends Model {}
ProjectUpdateOfProposal.init(
  {
    project_update_of_proposal_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    activity_images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    project_of_proposal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ProjectOfProposal",
        key: "project_of_proposal_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ProjectUpdateOfProposal",
    tableName: "ProjectUpdateOfProposal",
    freezeTableName: true,
    timestamps: false,
  },
);

export class VoteOfProposal extends Model {}
VoteOfProposal.init(
  {
    vote_of_proposal_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    proposal_of_green_area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ProposalOfGreenArea",
        key: "proposal_of_green_area_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "VoteOfProposal",
    tableName: "VoteOfProposal",
    freezeTableName: true,
    timestamps: false,
  },
);

Role.hasMany(User, { foreignKey: "role_id" });
User.belongsTo(Role, { foreignKey: "role_id" });

User.hasMany(ReportOfGreenArea, { foreignKey: "user_id" });
ReportOfGreenArea.belongsTo(User, { foreignKey: "user_id" });

GreenSpace.hasMany(ReportOfGreenArea, { foreignKey: "space_id" });
ReportOfGreenArea.belongsTo(GreenSpace, { foreignKey: "space_id" });

User.hasMany(GreenSpaceReview, { foreignKey: "user_id" });
GreenSpaceReview.belongsTo(User, { foreignKey: "user_id" });

GreenSpace.hasMany(GreenSpaceReview, { foreignKey: "space_id" });
GreenSpaceReview.belongsTo(GreenSpace, { foreignKey: "space_id" });

User.hasMany(ProposalOfGreenArea, { foreignKey: "user_id" });
ProposalOfGreenArea.belongsTo(User, { foreignKey: "user_id" });

GreenSpace.hasMany(ProposalOfGreenArea, { foreignKey: "space_id" });
ProposalOfGreenArea.belongsTo(GreenSpace, { foreignKey: "space_id" });

ProposalOfGreenArea.hasMany(VoteOfProposal, {
  foreignKey: "proposal_of_green_area_id",
});
VoteOfProposal.belongsTo(ProposalOfGreenArea, {
  foreignKey: "proposal_of_green_area_id",
});

ProposalOfGreenArea.hasMany(ProjectOfProposal, {
  foreignKey: "proposal_of_green_area_id",
});
ProjectOfProposal.belongsTo(ProposalOfGreenArea, {
  foreignKey: "proposal_of_green_area_id",
});

User.hasMany(VoteOfProposal, { foreignKey: "user_id" });
VoteOfProposal.belongsTo(User, { foreignKey: "user_id" });

GreenSpace.hasMany(ProjectOfProposal, { foreignKey: "space_id" });
ProjectOfProposal.belongsTo(GreenSpace, { foreignKey: "space_id" });

ProjectOfProposal.hasMany(ProjectUpdateOfProposal, {
  foreignKey: "project_of_proposal_id",
});
ProjectUpdateOfProposal.belongsTo(ProjectOfProposal, {
  foreignKey: "project_of_proposal_id",
});

User.hasMany(ProjectUpdateOfProposal, { foreignKey: "user_id" });
ProjectUpdateOfProposal.belongsTo(User, { foreignKey: "user_id" });

GreenSpace.hasMany(TreeInventory, { foreignKey: "space_id" });
TreeInventory.belongsTo(GreenSpace, { foreignKey: "space_id" });

TreeType.hasMany(TreeInventory, { foreignKey: "type_id" });
TreeInventory.belongsTo(TreeType, { foreignKey: "type_id" });

const alignProposalSchema = async () => {
  // Keep existing SQLite files compatible with newer proposal/project fields.
  await ProposalOfGreenArea.sync({ alter: true });
  await ProjectOfProposal.sync({ alter: true });
  await ProjectUpdateOfProposal.sync({ alter: true });
};

const enforceFixedRoles = async () => {
  const fixedRoles = [
    { role_name: "admin", description: "System administrator" },
    { role_name: "regular", description: "Regular platform user" },
  ] as const;

  const roleByName: Record<string, number> = {};
  for (const fixedRole of fixedRoles) {
    const [role] = await Role.findOrCreate({
      where: { role_name: fixedRole.role_name },
      defaults: {
        role_name: fixedRole.role_name,
        description: fixedRole.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (
      String(role.getDataValue("description") || "") !== fixedRole.description
    ) {
      await role.update({
        description: fixedRole.description,
        updated_at: new Date(),
      });
    }

    roleByName[fixedRole.role_name] = Number(role.getDataValue("role_id"));
  }

  const adminRoleId = roleByName.admin;
  const regularRoleId = roleByName.regular;

  const allRoles = await Role.findAll();
  const fixedRoleIds = new Set<number>([adminRoleId, regularRoleId]);

  for (const role of allRoles) {
    const roleId = Number(role.getDataValue("role_id"));
    if (fixedRoleIds.has(roleId)) {
      continue;
    }

    // Reassign users from non-fixed roles to regular before deleting the role.
    await User.update(
      {
        role_id: regularRoleId,
        updated_at: new Date(),
      },
      { where: { role_id: roleId } },
    );

    await role.destroy();
  }
};

export const initializeDatabase = async () => {
  try {
    await sequelize.sync();
    await alignProposalSchema();
    await enforceFixedRoles();
  } catch (err) {
    console.error("Database sync failed:", err);
    throw err;
  }
};
