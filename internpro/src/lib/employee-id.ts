import { prisma } from "./prisma";

export async function generateEmployeeId(joiningDate: Date): Promise<string> {
  const year = joiningDate.getFullYear();
  const prefix = `KKHS/${year}/`;

  const lastUser = await prisma.user.findFirst({
    where: { employeeId: { startsWith: prefix } },
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });

  let sequence = 1;
  if (lastUser?.employeeId) {
    const parts = lastUser.employeeId.split("/");
    const lastSeq = parseInt(parts[2]);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, "0")}`;
}
