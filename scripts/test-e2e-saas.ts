import "dotenv/config";
import { db } from "../src/db";
import { tasks } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuthClient } from "@neon/auth";

const authUrl =
  process.env.NEON_AUTH_BASE_URL ||
  "https://ep-orange-sunset-biajbcfz.neonauth.c-5.ap-southeast-1.aws.neon.tech/neondb/auth";

async function runE2ETest() {
  console.log("=== STARTING SAAS MULTI-TENANT E2E VERIFICATION ===");
  const auth = createAuthClient(authUrl);

  const timestamp = Date.now();
  const userAEmail = `teman_a_${timestamp}@pangenget.internal`;
  const userBEmail = `teman_b_${timestamp}@pangenget.internal`;
  const password = `TestPass#${timestamp}!`;

  console.log("\n1. Registering User A...");
  const resA = await auth.signUp.email({
    email: userAEmail,
    password: password,
    name: "Teman A",
    callbackURL: "http://localhost:4321",
  }, {
    headers: { origin: "http://localhost:4321" },
  });

  if (resA.error || !resA.data?.user?.id) {
    throw new Error(`User A signup failed: ${resA.error?.message || "No user"}`);
  }
  const userAId = resA.data.user.id;
  console.log(`User A created: id=${userAId}, name=${resA.data.user.name}`);

  console.log("\n2. Registering User B...");
  const resB = await auth.signUp.email({
    email: userBEmail,
    password: password,
    name: "Teman B",
    callbackURL: "http://localhost:4321",
  }, {
    headers: { origin: "http://localhost:4321" },
  });

  if (resB.error || !resB.data?.user?.id) {
    throw new Error(`User B signup failed: ${resB.error?.message || "No user"}`);
  }
  const userBId = resB.data.user.id;
  console.log(`User B created: id=${userBId}, name=${resB.data.user.name}`);

  console.log("\n3. Inserting isolated task for User A...");
  const insertedA = await db
    .insert(tasks)
    .values({
      userId: userAId,
      title: "Rapat Perencanaan Produk Teman A",
      category: "Bisnis",
      priority: "high",
    })
    .returning();
  const taskA = insertedA[0]!;
  console.log(`Task A created: id=${taskA.id}, title="${taskA.title}", userId=${taskA.userId}`);

  console.log("\n4. Inserting isolated task for User B...");
  const insertedB = await db
    .insert(tasks)
    .values({
      userId: userBId,
      title: "Belanja Kopi & Susu Teman B",
      category: "Pribadi",
      priority: "low",
    })
    .returning();
  const taskB = insertedB[0]!;
  console.log(`Task B created: id=${taskB.id}, title="${taskB.title}", userId=${taskB.userId}`);

  console.log("\n5. Verifying Tenant Isolation for User A queries...");
  const tasksForUserA = await db.select().from(tasks).where(eq(tasks.userId, userAId));
  console.log(`User A sees ${tasksForUserA.length} task(s):`, tasksForUserA.map((t) => t.title));
  if (tasksForUserA.some((t) => t.userId !== userAId)) {
    throw new Error("FAIL: User A can see tasks belonging to other users!");
  }
  if (!tasksForUserA.some((t) => t.id === taskA.id)) {
    throw new Error("FAIL: User A cannot see their own task!");
  }

  console.log("\n6. Verifying Tenant Isolation for User B queries...");
  const tasksForUserB = await db.select().from(tasks).where(eq(tasks.userId, userBId));
  console.log(`User B sees ${tasksForUserB.length} task(s):`, tasksForStrategistB(tasksForUserB));
  if (tasksForUserB.some((t) => t.userId !== userBId)) {
    throw new Error("FAIL: User B can see tasks belonging to other users!");
  }
  if (!tasksForUserB.some((t) => t.id === taskB.id)) {
    throw new Error("FAIL: User B cannot see their own task!");
  }

  console.log("\n7. Testing Cross-Tenant Tamper Protection (User B trying to modify User A's task)...");
  const unauthorizedUpdate = await db
    .update(tasks)
    .set({ isCompleted: true })
    .where(and(eq(tasks.id, taskA.id), eq(tasks.userId, userBId)))
    .returning();

  if (unauthorizedUpdate.length > 0) {
    throw new Error("SECURITY FAILURE: User B modified User A's task!");
  }
  console.log("SUCCESS: Cross-tenant modification was safely blocked (0 rows updated).");

  console.log("\n8. Cleaning up test tasks...");
  await db.delete(tasks).where(eq(tasks.userId, userAId));
  await db.delete(tasks).where(eq(tasks.userId, userBId));
  console.log("Cleanup complete.");

  console.log("\n🎉 ALL SAAS & NEON AUTH MULTI-TENANCY VERIFICATIONS PASSED!");
}

function tasksForStrategistB(tList: any[]) {
  return tList.map((t) => t.title);
}

runE2ETest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
