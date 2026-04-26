#!/usr/bin/env node
/**
 * Idempotent backfill: ensure every existing user has a personal
 * workspace, and that all of their resources (Agent, Channel,
 * Conversation, KnowledgeItem) are tagged with workspaceId.
 *
 * Safe to run multiple times — uses upserts and skips rows that
 * already have a workspaceId set.
 *
 * Usage:
 *   node scripts/backfill-workspaces.mjs
 *
 * Run automatically by `npm run deploy` after any schema migration.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, activeWorkspaceId: true },
  });
  console.log(`[backfill] found ${users.length} users`);

  let createdWorkspaces = 0;
  let updatedAgents = 0;
  let updatedChannels = 0;
  let updatedConversations = 0;
  let updatedKnowledge = 0;

  for (const user of users) {
    let ws = await prisma.workspace.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!ws) {
      const display = user.name?.trim() || user.email.split("@")[0];
      ws = await prisma.workspace.create({
        data: {
          name: `${display}'s Workspace`,
          ownerId: user.id,
          memberships: { create: { userId: user.id, role: "owner" } },
        },
      });
      createdWorkspaces++;
      console.log(`[backfill] created workspace ${ws.id} for user ${user.email}`);
    } else {
      // Ensure owner membership exists (may have been deleted manually).
      await prisma.membership.upsert({
        where: { workspaceId_userId: { workspaceId: ws.id, userId: user.id } },
        update: {},
        create: { workspaceId: ws.id, userId: user.id, role: "owner" },
      });
    }

    if (!user.activeWorkspaceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: ws.id },
      });
    }

    // Tag all the user's owned resources with this workspace, but only
    // those that don't already have a workspace assigned.
    const a = await prisma.agent.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: ws.id },
    });
    updatedAgents += a.count;

    const c = await prisma.channel.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: ws.id },
    });
    updatedChannels += c.count;

    const conv = await prisma.conversation.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: ws.id },
    });
    updatedConversations += conv.count;

    const k = await prisma.knowledgeItem.updateMany({
      where: { userId: user.id, workspaceId: null },
      data: { workspaceId: ws.id },
    });
    updatedKnowledge += k.count;
  }

  console.log(`[backfill] done.
  workspaces created: ${createdWorkspaces}
  agents tagged:      ${updatedAgents}
  channels tagged:    ${updatedChannels}
  convos tagged:      ${updatedConversations}
  knowledge tagged:   ${updatedKnowledge}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
