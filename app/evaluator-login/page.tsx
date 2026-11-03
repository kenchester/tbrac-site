"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, User } from "lucide-react";

export default function EvaluatorLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const UNVERIFIED_MSG =
    "This account is approved for evaluator access, but its email address isn't verified yet. Send yourself a verification email, open the link, then sign in again.";

  const sendVerification = async () => {
    setError("");
    const { error: err } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/evaluator/dashboard",
    });
    if (err) setError(err.message || "Could not send the verification email.");
    else setVerificationSent(true);
  };

  // Redirected here by the /evaluator gate after signing in without access.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("denied")) setError("This account does not have evaluator access.");
    if (q.get("unverified")) {
      setNeedsVerification(true);
      setError(UNVERIFIED_MSG);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);
      const res = await fetch("/api/evaluator/access", { cache: "no-store" });
      const access = res.ok ? await res.json() : { evaluator: false };
      if (!access.evaluator) {
        if (access.allowlisted && !access.emailVerified) {
          setNeedsVerification(true);
          setError(UNVERIFIED_MSG);
        } else {
          setError("This account does not have evaluator access.");
        }
        return;
      }
      router.push("/evaluator/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Evaluator Portal
            </h1>
            <p className="text-muted-foreground">
              Access the TBRAC assessment review dashboard
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your evaluator credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                {needsVerification && (
                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="w-full" onClick={sendVerification} disabled={!email || verificationSent}>
                      {verificationSent ? "Verification email sent — check your inbox" : "Send verification email"}
                    </Button>
                    {!email && <p className="text-xs text-muted-foreground">Enter your email address above first.</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="evaluator@tbrac.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <PasswordInput
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>Need access? Contact your administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
