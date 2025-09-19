import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    database: {
        provider: "sqlite",
        url: ":memory:",
    },
    socialProviders: {
        google: {
            clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "973872870030-pd8o0fdototnb2ouuinr3udcjptqrtg8.apps.googleusercontent.com",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "temp-secret",
        },
    },
    trustedOrigins: ["paycrypt://"],
    plugins: [expo()],
    emailAndPassword: { 
        enabled: false,
      }, 
});