import bcrypt from "bcryptjs";
import { Sequelize, DataTypes, Model } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false,
});

export class User extends Model {
  public id!: number;
  public name!: string;
  public username!: string;
  public password!: string;
  public role!: "admin" | "student";
  public email!: string;
  public points!: number;
  public avatarUrl!: string;
}

const DEFAULT_AVATAR_URL = "/default-avatar.svg";

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_AVATAR_URL,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  { sequelize, modelName: "User" },
);

export class Survey extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public active!: boolean;
  public type!: "yesno" | "rating";
}

Survey.init(
  {
    id: {
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "yesno",
      validate: {
        isIn: [["yesno", "rating"]],
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { sequelize, modelName: "Survey" },
);

export class Response extends Model {
  public id!: number;
  public surveyTitle!: string;
  public username!: string;
  public answers!: string;
}

Response.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    surveyTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answers: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Response" },
);

export class Suggestion extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public username!: string;
  public reviewed!: boolean;
}

Suggestion.init(
  {
    id: {
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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, modelName: "Suggestion" },
);

export class GreenSpace extends Model {
  public id!: number;
  public name!: string;
  public location!: string;
  public totalAreaM2!: number;
  public tallTreeCount!: number;
  public images!: string;
}

GreenSpace.init(
  {
    id: {
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
    totalAreaM2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    tallTreeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "[]",
    },
  },
  { sequelize, modelName: "GreenSpace" },
);

export class GreenSpaceReview extends Model {
  public id!: number;
  public greenSpaceId!: number;
  public username!: string;
  public rating!: number;
  public comment!: string;
}

GreenSpaceReview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    greenSpaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
  },
  { sequelize, modelName: "GreenSpaceReview" },
);

export const initializeDatabase = async () => {
  try {
    // Use alter to update the database schema for newly added fields.
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error("Database sync failed:", err);
    throw err;
  }

  const adminExists = await User.findOne({ where: { username: "admin" } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin User",
      username: "admin",
      password: hashedPassword,
      role: "admin",
      email: "admin@example.com",
      points: 0,
      avatarUrl: DEFAULT_AVATAR_URL,
    });
  }
};
