"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/auth/login"), 2000);
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
          {success ? (
            <>
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--status-success-bg)] mb-4">
                <CheckCircle size={24} className="text-[var(--status-success)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
                Password updated
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Redirecting you to sign in...
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--aiva-blue-glow)] mb-4">
                <Lock size={24} className="text-[var(--aiva-blue)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
                Set a new password
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose a strong password for your account.
              </p>
            </>
          )}
        </motion.div>

        {!success && (
          <motion.form variants={staggerItem} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">New password</label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Confirm password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--status-error)]">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </motion.form>
        )}

        <motion.div variants={staggerItem} className="text-center mt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <ArrowLeft size={12} />
            Back to sign in
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
