import bcrypt from "bcryptjs";
import { GreenSpace, Role, User, sequelize } from "./models";
import { greenSpaceSeeds, roleSeeds, userSeeds } from "./seedData";

declare const require: { main: unknown };
declare const module: unknown;
declare const process: { exit(code?: number): never };

const isDirectExecution =
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module;

export async function seedDatabase() {
  await sequelize.sync({ force: true });

  const roleByName: Record<string, number> = {};

  for (const role of roleSeeds) {
    const createdRole = await Role.create({
      role_name: role.role_name,
      description: role.description,
    });
    roleByName[role.role_name] = createdRole.getDataValue("role_id");
  }

  for (const user of userSeeds) {
    const roleId = roleByName[user.role_name];
    if (!roleId) {
      throw new Error(`Role not found for user: ${user.username}`);
    }

    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.create({
      name: user.name,
      email: user.email,
      username: user.username,
      password_hash: passwordHash,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      role_id: roleId,
    });
  }

  for (const greenSpaceSeed of greenSpaceSeeds) {
    await GreenSpace.create({
      name: greenSpaceSeed.name,
      location: greenSpaceSeed.location,
      total_area_m2: greenSpaceSeed.total_area_m2,
      trees_count: greenSpaceSeed.trees_count,
      images: JSON.stringify(greenSpaceSeed.images),
    });
  }

  console.log(
    `Seeding complete: ${roleSeeds.length} roles, ${userSeeds.length} users and ${greenSpaceSeeds.length} green spaces created.`,
  );
}

if (isDirectExecution) {
  seedDatabase()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Seeding failed:", error);
      await sequelize.close();
      process.exit(1);
    });
}
