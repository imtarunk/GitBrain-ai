import { auth, clerkClient } from "@clerk/nextjs/server";
import { error } from "console";
import { notFound, redirect } from "next/navigation";
import { db } from "~/server/db";

const SyncUser = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized user not found");
  }

  const client = clerkClient();
  const user = (await client).users.getUser(userId);

  if (!(await user).emailAddresses[0]?.emailAddress) {
    return notFound;
  }

  await db.user.upsert({
    where: { email: (await user).emailAddresses[0]?.emailAddress ?? "" },
    update: {
      imageURl: (await user).imageUrl,
      firstName: (await user).firstName,
      lastName: (await user).lastName,
    },
    create: {
      id: userId,
      email: (await user).emailAddresses[0]?.emailAddress ?? "",
      imageURl: (await user).imageUrl,
      firstName: (await user).firstName,
      lastName: (await user).lastName,
    },
  });

  return redirect("/dashboard");
};

export default SyncUser;
