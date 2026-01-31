import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

async function getIsManager() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return false;
  }

  const employee = await prisma.employee.findUnique({
    where: { email: session.user.email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const roles = employee?.roles.map((er) => er.role.roleCode) ?? [];
  return roles.includes("MANAGEMENT");
}

export default async function DashboardPage() {
  const isManager = await getIsManager();

  if (!isManager) {
    redirect("/");
  }

  return <DashboardClient />;
}
