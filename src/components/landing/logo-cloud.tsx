"use client";

import { motion } from "framer-motion";
import { linearFadeIn, viewportOnce } from "@/lib/animations";
import { Mail, MessageSquare, Hash, Users, Phone, ShoppingBag } from "lucide-react";

const integrations = [
  { name: "Gmail", icon: Mail, color: "#EA4335" },
  { name: "Outlook", icon: Mail, color: "#0078D4" },
  { name: "Slack", icon: Hash, color: "#E01E5A" },
  { name: "Teams", icon: Users, color: "#6264A7" },
  { name: "WhatsApp", icon: Phone, color: "#25D366" },
  { name: "Shopify", icon: ShoppingBag, color: "#96BF48" },
];

export function LogoCloud() {
  return (
    <motion.section
      variants={linearFadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="py-16 px-6"
    >
      <p className="text-center text-sm text-[var(--text-tertiary)] mb-8">
        Connects with the tools you already use
      </p>
      <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap max-w-3xl mx-auto">
        {integrations.map((int) => {
          const Icon = int.icon;
          return (
            <motion.div
              key={int.name}
              className="group flex flex-col items-center gap-2 cursor-default"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <Icon
                size={28}
                className="text-[var(--text-tertiary)] opacity-40 transition-all duration-300 group-hover:opacity-100"
                style={{ "--hover-color": int.color } as React.CSSProperties}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                {int.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
