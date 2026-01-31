import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import NominationsClient from "./NominationsClient";

async function getIsTeamLeader() {
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
  return roles.includes("TEAM_LEADER");
}

export default async function NominationsPage() {
  const isTeamLeader = await getIsTeamLeader();

  if (!isTeamLeader) {
    redirect("/");
  }

  return <NominationsClient />;
}
