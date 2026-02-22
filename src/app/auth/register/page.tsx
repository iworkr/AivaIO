"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, ProgressBar } from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, User, Building2, Mail } from "lucide-react";

const steps = [
  { title: "Create your account", description: "Start with your email and a secure password." },
  { title: "Tell us about yourself", description: "Help AIVA personalize your experience." },
  { title: "Set up your workspace", description: "Create or join a workspace for your team." },
];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          workspace_name: workspaceName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  const nextStep = () => {
    if (step === 0 && (!email || !password)) return;
    if (step === 1 && !name) return;
    if (step < 2) setStep(step + 1);
    else handleRegister();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
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
            {steps[step].title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {steps[step].description}
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div variants={staggerItem} className="mb-8">
          <ProgressBar value={((step + 1) / 3) * 100} />
          <p className="text-[10px] text-[var(--text-tertiary)] mt-2 text-center">
            Step {step + 1} of 3
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Password</label>
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Full Name</label>
                  <Input
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-elevated)]">
                  <div className="h-10 w-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--text-primary)] text-sm font-medium">
                    {name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : <User size={16} className="text-[var(--text-tertiary)]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {name || "Your Name"}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{email}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Workspace Name</label>
                  <Input
                    placeholder="Acme Inc"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-elevated)]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                      <Building2 size={16} className="text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {workspaceName || "Your Workspace"}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {workspaceName
                          ? `${workspaceName.toLowerCase().replace(/\s+/g, "-")}.aiva.io`
                          : "workspace.aiva.io"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-xs text-[var(--status-error)] mt-3">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button variant="ghost" size="md" onClick={prevStep}>
              <ArrowLeft size={14} />
              Back
            </Button>
          )}
          <Button className="flex-1" onClick={nextStep} disabled={loading}>
            {step === 2 ? (loading ? "Creating..." : "Create Workspace") : "Continue"}
            {!loading && <ArrowRight size={14} />}
          </Button>
        </div>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
