import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// All available permissions
export const ALL_PERMISSIONS = [
  // Dashboard
  { key: "dashboard.view", label: "View Dashboard", group: "Dashboard" },
  
  // Recruitment
  { key: "applications.view", label: "View Applications", group: "Recruitment" },
  { key: "applications.manage", label: "Manage Applications", group: "Recruitment" },
  { key: "interviews.view", label: "View Interviews", group: "Recruitment" },
  { key: "interviews.manage", label: "Manage Interviews", group: "Recruitment" },
  { key: "students.view", label: "View Students", group: "Recruitment" },
  { key: "students.manage", label: "Manage Students", group: "Recruitment" },

  // Academics
  { key: "programs.view", label: "View Programs", group: "Academics" },
  { key: "programs.manage", label: "Manage Programs", group: "Academics" },
  { key: "course_content.view", label: "View Course Content", group: "Academics" },
  { key: "course_content.manage", label: "Manage Course Content", group: "Academics" },
  { key: "reviews.view", label: "View Reviews", group: "Academics" },
  { key: "reviews.manage", label: "Manage Reviews", group: "Academics" },
  { key: "live_sessions.view", label: "View Live Sessions", group: "Academics" },
  { key: "live_sessions.manage", label: "Manage Live Sessions", group: "Academics" },

  // Tracking
  { key: "attendance.view", label: "View Attendance", group: "Tracking" },
  { key: "attendance.manage", label: "Manage Attendance", group: "Tracking" },
  { key: "progress.view", label: "View Progress", group: "Tracking" },
  { key: "reports.view", label: "View Reports", group: "Tracking" },
  { key: "leaderboard.view", label: "View Leaderboard", group: "Tracking" },

  // Documents
  { key: "letters.view", label: "View Letters", group: "Documents" },
  { key: "letters.manage", label: "Manage Letters", group: "Documents" },
  { key: "documents.view", label: "View Documents", group: "Documents" },
  { key: "documents.manage", label: "Manage Documents", group: "Documents" },
  { key: "completion.view", label: "View Completion", group: "Documents" },
  { key: "completion.manage", label: "Manage Completion", group: "Documents" },

  // HR & Finance
  { key: "salary.view", label: "View Salary", group: "HR & Finance" },
  { key: "salary.manage", label: "Manage Salary", group: "HR & Finance" },
  { key: "leaves.view", label: "View Leaves", group: "HR & Finance" },
  { key: "leaves.manage", label: "Manage Leaves", group: "HR & Finance" },
  { key: "holidays.view", label: "View Holidays", group: "HR & Finance" },
  { key: "holidays.manage", label: "Manage Holidays", group: "HR & Finance" },
  { key: "payments.view", label: "View Payments", group: "HR & Finance" },
  { key: "payments.manage", label: "Manage Payments", group: "HR & Finance" },

  // Communication
  { key: "chat.view", label: "View Chat", group: "Communication" },
  { key: "discussions.view", label: "View Discussions", group: "Communication" },
  { key: "discussions.manage", label: "Manage Discussions", group: "Communication" },
  { key: "announcements.view", label: "View Announcements", group: "Communication" },
  { key: "announcements.manage", label: "Manage Announcements", group: "Communication" },

  // Management
  { key: "analytics.view", label: "View Analytics", group: "Management" },
  { key: "team_leaders.view", label: "View Team Leaders", group: "Management" },
  { key: "team_leaders.manage", label: "Manage Team Leaders", group: "Management" },
  { key: "agents.view", label: "View Agents", group: "Management" },
  { key: "agents.manage", label: "Manage Agents", group: "Management" },
  { key: "campaigns.view", label: "View Campaigns", group: "Management" },
  { key: "campaigns.manage", label: "Manage Campaigns", group: "Management" },
  { key: "jobs.view", label: "View Jobs", group: "Management" },
  { key: "jobs.manage", label: "Manage Jobs", group: "Management" },
  { key: "testimonials.view", label: "View Testimonials", group: "Management" },
  { key: "testimonials.manage", label: "Manage Testimonials", group: "Management" },
  { key: "activity_log.view", label: "View Activity Log", group: "Management" },

  // System
  { key: "users.view", label: "View Users", group: "System" },
  { key: "users.manage", label: "Manage Users", group: "System" },
  { key: "roles.view", label: "View Roles", group: "System" },
  { key: "roles.manage", label: "Manage Roles", group: "System" },
  { key: "site_content.manage", label: "Manage Site Content", group: "System" },
  { key: "settings.view", label: "View Settings", group: "System" },
  { key: "settings.manage", label: "Manage Settings", group: "System" },
];

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ roles, allPermissions: ALL_PERMISSIONS });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === "seed") {
    // Seed default roles
    const defaults = [
      {
        name: "admin",
        displayName: "Super Admin",
        description: "Full access to everything",
        isSystem: true,
        permissions: ALL_PERMISSIONS.map(p => p.key),
      },
      {
        name: "organization",
        displayName: "Admin",
        description: "Organization-level access",
        isSystem: true,
        permissions: ALL_PERMISSIONS.map(p => p.key),
      },
      {
        name: "teamleader",
        displayName: "Team Leader",
        description: "Manages assigned batches and students",
        isSystem: true,
        permissions: [
          "dashboard.view", "students.view", "students.manage", "programs.view",
          "course_content.view", "reviews.view", "reviews.manage", "live_sessions.view",
          "live_sessions.manage", "attendance.view", "attendance.manage", "progress.view",
          "reports.view", "leaderboard.view", "letters.view", "documents.view",
          "completion.view", "completion.manage", "chat.view", "discussions.view",
          "discussions.manage", "announcements.view",
        ],
      },
      {
        name: "agent",
        displayName: "Agent",
        description: "Referral agent with limited access",
        isSystem: true,
        permissions: [
          "dashboard.view", "agents.view",
        ],
      },
      {
        name: "student",
        displayName: "Student",
        description: "Student/Intern access",
        isSystem: true,
        permissions: [
          "dashboard.view", "interviews.view", "live_sessions.view", "attendance.view",
          "progress.view", "reports.view", "leaderboard.view", "letters.view",
          "documents.view", "chat.view", "discussions.view", "announcements.view",
          "jobs.view",
        ],
      },
    ];

    for (const def of defaults) {
      const existing = await prisma.role.findUnique({ where: { name: def.name } });
      if (!existing) {
        await prisma.role.create({
          data: {
            name: def.name,
            displayName: def.displayName,
            description: def.description,
            isSystem: def.isSystem,
            permissions: {
              create: def.permissions.map(p => ({ permission: p })),
            },
          },
        });
      }
    }

    return NextResponse.json({ message: "Default roles seeded" });
  }

  if (action === "create") {
    const { name, displayName, description, permissions } = body;
    if (!name || !displayName) {
      return NextResponse.json({ error: "Name and display name required" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, "_"),
        displayName,
        description: description || null,
        permissions: {
          create: (permissions || []).map((p: string) => ({ permission: p })),
        },
      },
      include: { permissions: true },
    });

    return NextResponse.json(role, { status: 201 });
  }

  if (action === "update") {
    const { id, displayName, description, permissions } = body;
    if (!id) return NextResponse.json({ error: "Role ID required" }, { status: 400 });

    // Delete old permissions and recreate
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    const role = await prisma.role.update({
      where: { id },
      data: {
        displayName: displayName || undefined,
        description: description || undefined,
        permissions: {
          create: (permissions || []).map((p: string) => ({ permission: p })),
        },
      },
      include: { permissions: true },
    });

    return NextResponse.json(role);
  }

  if (action === "delete") {
    const { id } = body;
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (role.isSystem) return NextResponse.json({ error: "Cannot delete system role" }, { status: 400 });

    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ message: "Role deleted" });
  }

  if (action === "assign_role") {
    const { userId, roleName } = body;
    if (!userId || !roleName) return NextResponse.json({ error: "User ID and role required" }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: { role: roleName },
    });

    return NextResponse.json({ message: "Role assigned" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
