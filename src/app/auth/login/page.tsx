"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { linearFadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, Github } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/app/inbox");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background-main)] flex items-center justify-center px-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        <motion.div variants={staggerItem} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img src="/aiva-mark.svg" alt="AIVA" className="h-8 w-8" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to your AIVA workspace.
          </p>
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-3 mb-6">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleOAuth("google")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleOAuth("github")}
          >
            <Github size={16} />
            Continue with GitHub
          </Button>
        </motion.div>

        <motion.div variants={staggerItem} className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-subtle)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--background-main)] px-3 text-[var(--text-tertiary)]">
              or continue with email
            </span>
          </div>
        </motion.div>

        <motion.form variants={staggerItem} onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-[var(--text-secondary)]">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-[var(--status-error)]">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={14} />}
          </Button>
        </motion.form>

        <motion.p variants={staggerItem} className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Create one
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
