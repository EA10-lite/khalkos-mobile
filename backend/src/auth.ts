import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    provider: "pg",
    url: process.env["DATABASE_URL"] || "postgres://macbook@localhost:5432/khalkos_auth",
  },
  plugins: [expo()],
  emailAndPassword: { 
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env["GOOGLE_CLIENT_ID"] || "973872870030-pd8o0fdototnb2ouuinr3udcjptqrtg8.apps.googleusercontent.com",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] || "temp-secret",
    },
  },
  trustedOrigins: ["http://localhost:8081", "paycrypt://"],
  secret: process.env["AUTH_SECRET"] || "super-secret-key-minimum-32-characters-long-for-development",
});

export type Session = typeof auth.$Infer.Session;
