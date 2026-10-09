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
    perimeter_points: {
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
      allowNull: true,
      references: {
        model: "TreeType",
        key: "type_id",
      },
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "approved",
    },
    submitted_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    validated_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "User",
        key: "user_id",
      },
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

export class GreenMetricRecord extends Model {}
GreenMetricRecord.init(
  {
    record_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    calculation_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_campus_area_m2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    green_area_m2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    campus_population: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    dense_vegetation_area_m2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    rainwater_absorption_area_m2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    sustainability_budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    conservation_operation_budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_1_green_area_ratio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_2_green_area_per_capita: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_3_dense_vegetation_ratio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_4_rainwater_absorption_ratio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_5_sustainability_budget_share: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    metric_6_conservation_operation_share: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    created_by_user_id: {
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
    modelName: "GreenMetricRecord",
    tableName: "GreenMetricRecord",
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["calculation_date"],
      },
    ],
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
    minimum_votes_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    voting_starts: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    voting_ends: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approximate_execution_duration: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    estimated_budget: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    proposal_images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
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

export class FindFlowerScore extends Model {}
FindFlowerScore.init(
  {
    find_flower_score_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "User",
        key: "user_id",
      },
    },
    max_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    best_time_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    best_moves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
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
    modelName: "FindFlowerScore",
    tableName: "FindFlowerScore",
    freezeTableName: true,
    timestamps: false,
  },
);

export class Event extends Model {}
Event.init(
  {
    event_id: {
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
      defaultValue: "",
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    closure_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    closure_images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
    created_by_user_id: {
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
    modelName: "Event",
    tableName: "Event",
    freezeTableName: true,
    timestamps: false,
  },
);

export class EventEnrollment extends Model {}
EventEnrollment.init(
  {
    event_enrollment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Event",
        key: "event_id",
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
    modelName: "EventEnrollment",
    tableName: "EventEnrollment",
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["event_id", "user_id"],
      },
    ],
  },
);

Role.hasMany(User, { foreignKey: "role_id" });
User.belongsTo(Role, { foreignKey: "role_id" });

User.hasMany(ReportOfGreenArea, { foreignKey: "user_id" });
ReportOfGreenArea.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(GreenMetricRecord, { foreignKey: "created_by_user_id" });
GreenMetricRecord.belongsTo(User, {
  foreignKey: "created_by_user_id",
  as: "CreatedBy",
});

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

User.hasOne(FindFlowerScore, { foreignKey: "user_id" });
FindFlowerScore.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Event, { foreignKey: "created_by_user_id" });
Event.belongsTo(User, {
  foreignKey: "created_by_user_id",
  as: "CreatedBy",
});

Event.hasMany(EventEnrollment, { foreignKey: "event_id" });
EventEnrollment.belongsTo(Event, { foreignKey: "event_id" });

User.hasMany(EventEnrollment, { foreignKey: "user_id" });
EventEnrollment.belongsTo(User, {
  foreignKey: "user_id",
  as: "Participant",
});

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

User.hasMany(TreeInventory, { foreignKey: "submitted_by_user_id" });
TreeInventory.belongsTo(User, {
  foreignKey: "submitted_by_user_id",
  as: "SubmittedBy",
});

User.hasMany(TreeInventory, { foreignKey: "validated_by_user_id" });
TreeInventory.belongsTo(User, {
  foreignKey: "validated_by_user_id",
  as: "ValidatedBy",
});

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

const ensureProposalValidationColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const proposalTable = await queryInterface.describeTable(
    "ProposalOfGreenArea",
  );

  if (!("approximate_execution_duration" in proposalTable)) {
    await queryInterface.addColumn(
      "ProposalOfGreenArea",
      "approximate_execution_duration",
      {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    );
  }

  if (!("estimated_budget" in proposalTable)) {
    await queryInterface.addColumn("ProposalOfGreenArea", "estimated_budget", {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    });
  }

  if (!("proposal_images" in proposalTable)) {
    await queryInterface.addColumn("ProposalOfGreenArea", "proposal_images", {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    });
  }

  if (!("rejection_reason" in proposalTable)) {
    await queryInterface.addColumn("ProposalOfGreenArea", "rejection_reason", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  }
};

const ensureEventColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const eventTable = await queryInterface.describeTable("Event");

  if (!("event_date" in eventTable)) {
    await queryInterface.addColumn("Event", "event_date", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });
  }
};

const ensureGreenSpacePerimeterColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const greenSpaceTable = await queryInterface.describeTable("GreenSpace");

  if (!("perimeter_points" in greenSpaceTable)) {
    await queryInterface.addColumn("GreenSpace", "perimeter_points", {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    });
  }
};

const dropTreeTypeSuggestionTable = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const hasTreeTypeSuggestionTable = tables
    .map((table) => String(table))
    .includes("TreeTypeSuggestion");

  if (hasTreeTypeSuggestionTable) {
    await queryInterface.dropTable("TreeTypeSuggestion");
  }
};

export const initializeDatabase = async () => {
  try {
    await sequelize.sync();
    await dropTreeTypeSuggestionTable();
    await ensureGreenSpacePerimeterColumn();
    await ensureProposalValidationColumns();
    await ensureEventColumns();
    await enforceFixedRoles();
  } catch (err) {
    console.error("Database sync failed:", err);
    throw err;
  }
};
