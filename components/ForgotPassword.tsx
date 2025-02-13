"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabaseUrl = "https://lliemhskmctauvmbqzdi.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaWVtaHNrbWN0YXV2bWJxemRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0Mjg3MzIsImV4cCI6MjA1NTAwNDczMn0.dZ_93DKDL7b-Vww9FTt2uIaOZdwWN-L-zI4uRkaER7M";
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export default function ForgotPassword({
  onReset,
  onSwitch,
}: {
  onReset: () => void;
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://your-domain.com/reset-password",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Password reset email sent! Check your inbox.");
      setEmail("");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-center">Forgot Password</h2>
      {message && <p className="text-center text-green-600">{message}</p>}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full border rounded p-2"
        />
      </div>
      <div className="space-y-2">
        <Button onClick={handleReset} className="bg-blue-500 text-white w-full">
          Send Reset Link
        </Button>
        <Button
          onClick={onSwitch}
          variant="ghost"
          className="text-blue-500 w-full"
        >
          Back to Sign In
        </Button>
      </div>
    </div>
  );
}
