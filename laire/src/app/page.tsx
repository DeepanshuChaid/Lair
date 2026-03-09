"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function AuthDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    }, {
      onSuccess: () => console.log("Logged in!"),
      onError: (ctx) => alert(ctx.error.message),
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <input 
        type="email" 
        placeholder="Email" 
        onChange={(e) => setEmail(e.target.value)} 
        className="border p-2"
      />
      <input 
        type="password" 
        placeholder="Password" 
        onChange={(e) => setPassword(e.target.value)} 
        className="border p-2"
      />
      <button onClick={handleSignIn} className="bg-blue-500 text-white p-2">
        Sign In
      </button>
      <button onClick={handleSignOut} className="bg-red-500 text-white p-2">
        Sign Out
      </button>
    </div>
  );
}
