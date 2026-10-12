import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isStaffRole, type StaffRole } from "@/lib/roles";

export class AuthError extends Error {
  constructor(message = "You do not have access to this action.") {
    super(message);
    this.name = "AuthError";
  }
}

type SessionMetadata = {
  metadata?: {
    role?: unknown;
  };
};

export async function requireUser() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in");
  }

  const claims = session.sessionClaims as SessionMetadata | null;
  let role = isStaffRole(claims?.metadata?.role) ? claims.metadata.role : null;

  if (!role) {
    const user = await currentUser();
    if (isStaffRole(user?.publicMetadata?.role)) {
      role = user.publicMetadata.role;
    }
  }

  return { userId: session.userId, role };
}

export async function requireRole(...allowed: StaffRole[]) {
  const user = await requireUser();
  if (!user.role || (user.role !== "admin" && !allowed.includes(user.role))) {
    throw new AuthError();
  }
  return user;
}

export async function guardRole(
  ...allowed: StaffRole[]
): Promise<{ error: string } | null> {
  try {
    await requireRole(...allowed);
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }
    throw error;
  }
}
