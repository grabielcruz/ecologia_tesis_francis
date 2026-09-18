import bcrypt from "bcryptjs";
import {
  FindFlowerScore,
  GreenMetricRecord,
  GreenSpace,
  GreenSpaceReview,
  ProjectOfProposal,
  ProjectUpdateOfProposal,
  ProposalOfGreenArea,
  ReportOfGreenArea,
  Role,
  TreeType,
  TreeInventory,
  User,
  VoteOfProposal,
  sequelize,
} from "./models";
import {
  findFlowerScoreSeeds,
  greenMetricRecordSeeds,
  greenSpaceSeeds,
  greenSpaceReviewSeeds,
  projectOfProposalSeeds,
  projectUpdateOfProposalSeeds,
  proposalSeeds,
  reportOfGreenAreaSeeds,
  roleSeeds,
  treeTypeSeeds,
  treeInventorySeeds,
  userSeeds,
  voteOfProposalSeeds,
} from "./seedData";

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
  const userIdByUsername: Record<string, number> = {};
  const spaceIdByName: Record<string, number> = {};
  const proposalIdByTitle: Record<string, number> = {};
  const projectIdByTitle: Record<string, number> = {};
  const proposalById: Record<number, ProposalOfGreenArea> = {};
  const treeTypeIdByName: Record<string, number> = {};

  const normalizeTreeNameKey = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("es");

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
    const createdUser = await User.create({
      name: user.name,
      email: user.email,
      username: user.username,
      password_hash: passwordHash,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      role_id: roleId,
    });
    userIdByUsername[user.username] = Number(
      createdUser.getDataValue("user_id"),
    );
  }

  for (const scoreSeed of findFlowerScoreSeeds) {
    const userId = userIdByUsername[scoreSeed.username];
    if (!userId) {
      throw new Error(
        `User not found for find flower score seed: ${scoreSeed.username}`,
      );
    }

    const updatedAt = new Date(scoreSeed.updated_at);

    await FindFlowerScore.create({
      user_id: userId,
      max_score: scoreSeed.max_score,
      best_time_seconds: scoreSeed.best_time_seconds,
      best_moves: scoreSeed.best_moves,
      created_at: updatedAt,
      updated_at: updatedAt,
    });
  }

  for (const greenSpaceSeed of greenSpaceSeeds) {
    const createdGreenSpace = await GreenSpace.create({
      name: greenSpaceSeed.name,
      location: greenSpaceSeed.location,
      total_area_m2: greenSpaceSeed.total_area_m2,
      trees_count: greenSpaceSeed.trees_count,
      images: JSON.stringify(greenSpaceSeed.images),
    });
    spaceIdByName[greenSpaceSeed.name] = Number(
      createdGreenSpace.getDataValue("space_id"),
    );
  }

  for (const reviewSeed of greenSpaceReviewSeeds) {
    const spaceId = spaceIdByName[reviewSeed.green_space_name];
    if (!spaceId) {
      throw new Error(
        `Green space not found for review seed: ${reviewSeed.green_space_name}`,
      );
    }

    const userId = userIdByUsername[reviewSeed.username];
    if (!userId) {
      throw new Error(`User not found for review seed: ${reviewSeed.username}`);
    }

    const createdAt = new Date(reviewSeed.created_at);

    await GreenSpaceReview.create({
      space_id: spaceId,
      user_id: userId,
      review_notes: reviewSeed.review_notes,
      rating: reviewSeed.rating,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  for (const treeTypeSeed of treeTypeSeeds) {
    const createdTreeType = await TreeType.create({
      name: treeTypeSeed.name,
      description: treeTypeSeed.description,
      reference_images: JSON.stringify(treeTypeSeed.reference_images),
      created_at: new Date(),
      updated_at: new Date(),
    });

    treeTypeIdByName[normalizeTreeNameKey(treeTypeSeed.name)] = Number(
      createdTreeType.getDataValue("type_id"),
    );
  }

  for (const inventorySeed of treeInventorySeeds) {
    const spaceId = spaceIdByName[inventorySeed.green_space_name];
    if (!spaceId) {
      throw new Error(
        `Green space not found for tree inventory seed: ${inventorySeed.green_space_name}`,
      );
    }

    const typeId =
      treeTypeIdByName[normalizeTreeNameKey(inventorySeed.tree_type_name)];
    if (!typeId) {
      throw new Error(
        `Tree type not found for tree inventory seed: ${inventorySeed.tree_type_name}`,
      );
    }

    const createdAt = new Date(inventorySeed.created_at);
    await TreeInventory.create({
      name: inventorySeed.name,
      health_status: inventorySeed.health_status,
      space_id: spaceId,
      type_id: typeId,
      status: "approved",
      submitted_by_user_id: userIdByUsername.admin,
      validated_by_user_id: userIdByUsername.admin,
      images: JSON.stringify(inventorySeed.image_urls),
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  for (const reportSeed of reportOfGreenAreaSeeds) {
    const spaceId = spaceIdByName[reportSeed.green_space_name];
    if (!spaceId) {
      throw new Error(
        `Green space not found for report seed: ${reportSeed.green_space_name}`,
      );
    }

    const userId = userIdByUsername[reportSeed.username];
    if (!userId) {
      throw new Error(`User not found for report seed: ${reportSeed.username}`);
    }

    const createdAt = new Date(reportSeed.created_at);

    await ReportOfGreenArea.create({
      title: reportSeed.title,
      description: reportSeed.description,
      url_images: JSON.stringify(reportSeed.url_images),
      state: reportSeed.state,
      user_id: userId,
      space_id: spaceId,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  for (const metricSeed of greenMetricRecordSeeds) {
    const userId = userIdByUsername[metricSeed.username];
    if (!userId) {
      throw new Error(
        `User not found for green metric seed: ${metricSeed.username}`,
      );
    }

    const totalArea = metricSeed.total_campus_area_m2;
    const greenArea = metricSeed.green_area_m2;
    const denseArea = metricSeed.dense_vegetation_area_m2;
    const rainArea = metricSeed.rainwater_absorption_area_m2;
    const sustainabilityBudget = metricSeed.sustainability_budget;
    const conservationBudget = metricSeed.conservation_operation_budget;
    const totalBudget = sustainabilityBudget + conservationBudget;

    const metric1 = totalArea > 0 ? (greenArea / totalArea) * 100 : 0;
    const metric2 =
      metricSeed.campus_population > 0
        ? greenArea / metricSeed.campus_population
        : 0;
    const metric3 = totalArea > 0 ? (denseArea / totalArea) * 100 : 0;
    const metric4 = totalArea > 0 ? (rainArea / totalArea) * 100 : 0;
    const metric5 =
      totalBudget > 0 ? (sustainabilityBudget / totalBudget) * 100 : 0;
    const metric6 =
      totalBudget > 0 ? (conservationBudget / totalBudget) * 100 : 0;

    await GreenMetricRecord.create({
      calculation_date: new Date(metricSeed.calculation_date),
      total_campus_area_m2: totalArea,
      green_area_m2: greenArea,
      campus_population: metricSeed.campus_population,
      dense_vegetation_area_m2: denseArea,
      rainwater_absorption_area_m2: rainArea,
      sustainability_budget: sustainabilityBudget,
      conservation_operation_budget: conservationBudget,
      metric_1_green_area_ratio: metric1,
      metric_2_green_area_per_capita: metric2,
      metric_3_dense_vegetation_ratio: metric3,
      metric_4_rainwater_absorption_ratio: metric4,
      metric_5_sustainability_budget_share: metric5,
      metric_6_conservation_operation_share: metric6,
      created_by_user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  for (const proposalSeed of proposalSeeds) {
    const userId = userIdByUsername[proposalSeed.username];
    if (!userId) {
      throw new Error(
        `User not found for proposal: ${proposalSeed.title} (${proposalSeed.username})`,
      );
    }

    const spaceId = spaceIdByName[proposalSeed.green_space_name];
    if (!spaceId) {
      throw new Error(
        `Green space not found for proposal: ${proposalSeed.title} (${proposalSeed.green_space_name})`,
      );
    }

    const votingStarts = proposalSeed.voting_starts
      ? new Date(proposalSeed.voting_starts)
      : null;
    const votingEnds = proposalSeed.voting_ends
      ? new Date(proposalSeed.voting_ends)
      : null;

    const createdProposal = await ProposalOfGreenArea.create({
      title: proposalSeed.title,
      description: proposalSeed.description,
      status: proposalSeed.status,
      total_votes: 0,
      minimum_votes_required: proposalSeed.minimum_votes_required ?? null,
      voting_starts: votingStarts,
      voting_ends: votingEnds,
      approximate_execution_duration:
        proposalSeed.approximate_execution_duration ?? null,
      estimated_budget: proposalSeed.estimated_budget ?? null,
      proposal_images: JSON.stringify(proposalSeed.proposal_images ?? []),
      rejection_reason: proposalSeed.rejection_reason ?? null,
      user_id: userId,
      space_id: spaceId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const proposalId = Number(
      createdProposal.getDataValue("proposal_of_green_area_id"),
    );
    proposalIdByTitle[proposalSeed.title] = proposalId;
    proposalById[proposalId] = createdProposal;
  }

  const voteTotalsByProposalId: Record<number, number> = {};

  for (const voteSeed of voteOfProposalSeeds) {
    const proposalId = proposalIdByTitle[voteSeed.proposal_title];
    if (!proposalId) {
      throw new Error(
        `Proposal not found for vote seed: ${voteSeed.proposal_title}`,
      );
    }

    const userId = userIdByUsername[voteSeed.username];
    if (!userId) {
      throw new Error(`User not found for vote seed: ${voteSeed.username}`);
    }

    await VoteOfProposal.create({
      proposal_of_green_area_id: proposalId,
      user_id: userId,
      created_at: new Date(voteSeed.created_at),
    });

    voteTotalsByProposalId[proposalId] =
      (voteTotalsByProposalId[proposalId] || 0) + 1;
  }

  for (const proposalSeed of proposalSeeds) {
    const proposalId = proposalIdByTitle[proposalSeed.title];
    const proposal = proposalById[proposalId];
    if (!proposal) {
      continue;
    }

    await proposal.update({
      total_votes: voteTotalsByProposalId[proposalId] || 0,
      updated_at: new Date(),
    });
  }

  for (const projectSeed of projectOfProposalSeeds) {
    const proposalId = proposalIdByTitle[projectSeed.proposal_title];
    if (!proposalId) {
      throw new Error(
        `Proposal not found for project seed: ${projectSeed.proposal_title}`,
      );
    }

    const spaceId = spaceIdByName[projectSeed.green_space_name];
    if (!spaceId) {
      throw new Error(
        `Green space not found for project seed: ${projectSeed.green_space_name}`,
      );
    }

    const createdProject = await ProjectOfProposal.create({
      title: projectSeed.title,
      description: projectSeed.description,
      completed_status: projectSeed.completed_status,
      proposal_of_green_area_id: proposalId,
      space_id: spaceId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    projectIdByTitle[projectSeed.title] = Number(
      createdProject.getDataValue("project_of_proposal_id"),
    );
  }

  for (const projectUpdateSeed of projectUpdateOfProposalSeeds) {
    const projectId = projectIdByTitle[projectUpdateSeed.project_title];
    if (!projectId) {
      throw new Error(
        `Project not found for project update seed: ${projectUpdateSeed.project_title}`,
      );
    }

    const userId = userIdByUsername[projectUpdateSeed.username];
    if (!userId) {
      throw new Error(
        `User not found for project update seed: ${projectUpdateSeed.username}`,
      );
    }

    const createdAt = new Date(projectUpdateSeed.created_at);

    await ProjectUpdateOfProposal.create({
      title: projectUpdateSeed.title,
      description: projectUpdateSeed.description,
      activity_images: JSON.stringify(projectUpdateSeed.activity_images),
      project_of_proposal_id: projectId,
      user_id: userId,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  console.log(
    `Seeding complete: ${roleSeeds.length} roles, ${userSeeds.length} users, ${findFlowerScoreSeeds.length} find flower scores, ${greenSpaceSeeds.length} green spaces, ${greenSpaceReviewSeeds.length} green space reviews, ${treeTypeSeeds.length} tree types, ${treeInventorySeeds.length} trees in inventory, ${reportOfGreenAreaSeeds.length} reports, ${greenMetricRecordSeeds.length} green metric records, ${proposalSeeds.length} proposals, ${voteOfProposalSeeds.length} votes, ${projectOfProposalSeeds.length} projects and ${projectUpdateOfProposalSeeds.length} project updates created.`,
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
