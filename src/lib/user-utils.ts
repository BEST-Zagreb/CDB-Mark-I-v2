import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/types/user";

type AddedByInfo = User["addedByUser"];

export async function resolveAddedByUser(
  addedById: string | null
): Promise<AddedByInfo> {
  if (!addedById) {
    return null;
  }

  const [adder] = await db
    .select({ fullName: appUsers.fullName, email: appUsers.email })
    .from(appUsers)
    .where(eq(appUsers.id, addedById))
    .limit(1);

  if (!adder) {
    return {
      id: addedById,
      fullName: null,
      email: null,
    };
  }

  return {
    id: addedById,
    fullName: adder.fullName,
    email: adder.email,
  };
}
