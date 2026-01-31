import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL is optional if the auth server is on the same domain
});

export const { signIn, signUp, signOut, useSession } = authClient;
