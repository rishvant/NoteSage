// components/AuthForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = createClientComponentClient();

  const handleAuth = async (isSignUp: boolean) => {
    try {
      setLoading(true);

      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email before signing in.");
        }
        throw error;
      }

      toast({
        title: "Success",
        description: isSignUp
          ? "Account created successfully"
          : "Signed in successfully",
      });

      if (onSuccess) onSuccess();
      router.push("/notes");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Authentication failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      {["signin", "signup"].map((tab) => (
        <TabsContent key={tab} value={tab}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`email-${tab}`}>Email</Label>
              <Input
                id={`email-${tab}`}
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`password-${tab}`}>Password</Label>
              <Input
                id={`password-${tab}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAuth(tab === "signup")}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : tab === "signup"
                ? "Sign Up"
                : "Sign In"}
            </Button>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
