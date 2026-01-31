import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DepartmentSmesClient from "./DepartmentSmesClient";

async function getIsCoordinator() {
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
  return roles.includes("COORDINATOR");
}

export default async function DepartmentSmesPage() {
  const isCoordinator = await getIsCoordinator();

  if (!isCoordinator) {
    redirect("/");
  }

  return <DepartmentSmesClient />;
}
