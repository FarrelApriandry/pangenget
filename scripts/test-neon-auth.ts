import "dotenv/config";
import { createAuthClient } from "@neon/auth";

const authUrl = process.env.NEON_AUTH_BASE_URL || "https://ep-orange-sunset-biajbcfz.neonauth.c-5.ap-southeast-1.aws.neon.tech/neondb/auth";

async function main() {
  console.log("Connecting to Neon Auth at:", authUrl);
  const client = createAuthClient(authUrl);

  const testEmail = `sahabat_${Date.now()}@pangenget.internal`;
  const testPassword = `Pangenget#${Math.random().toString(36).substring(2, 10)}!`;
  const testName = "Sahabat Pangenget";

  console.log(`Attempting sign up for test user: ${testEmail}...`);
  const signUpRes = await client.signUp.email({
    email: testEmail,
    password: testPassword,
    name: testName,
    callbackURL: "http://localhost:4321",
  }, {
    headers: {
      origin: "http://localhost:4321",
    },
  });

  if (signUpRes.error) {
    console.error("Sign up failed:", signUpRes.error.message || signUpRes.error);
    process.exit(1);
  }

  console.log("Sign up succeeded!");
  if (signUpRes.data?.user) {
    console.log("User details:", {
      id: signUpRes.data.user.id,
      email: signUpRes.data.user.email,
      name: signUpRes.data.user.name,
      createdAt: signUpRes.data.user.createdAt,
    });
  }

  console.log("Sign up response keys:", Object.keys(signUpRes.data || {}));
  const sessionData = (signUpRes.data as any)?.session;
  if (sessionData) {
    console.log("Session info:", {
      id: sessionData.id,
      userId: sessionData.userId,
      expiresAt: sessionData.expiresAt,
      hasToken: Boolean(sessionData.token),
    });
  }

  console.log("\nSigning in test user to verify credentials...");
  const signInRes = await client.signIn.email({
    email: testEmail,
    password: testPassword,
  }, {
    headers: {
      origin: "http://localhost:4321",
    },
  });

  if (signInRes.error) {
    console.error("Sign in failed:", signInRes.error);
    process.exit(1);
  }

  console.log("Sign in response keys:", Object.keys(signInRes.data || {}));
  console.log("Read current user back:", {
    id: signInRes.data?.user?.id,
    email: signInRes.data?.user?.email,
    name: signInRes.data?.user?.name,
  });

  console.log("\n=== NEON AUTH TEST PASSED: SIGNUP & CURRENT USER READ-BACK SUCCESSFUL! ===");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
