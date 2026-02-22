"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Input } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    setSent(true);
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
          {sent ? (
            <>
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--status-success-bg)] mb-4">
                <CheckCircle size={24} className="text-[var(--status-success)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
                Check your email
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                We sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </>
          )}
        </motion.div>

        {!sent && (
          <motion.form variants={staggerItem} onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
              {!loading && <ArrowRight size={14} />}
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
