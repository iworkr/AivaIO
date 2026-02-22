"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { linearFadeIn, viewportOnce } from "@/lib/animations";

const integrations = [
  { name: "Gmail", svg: "/icons/gmail.svg" },
  { name: "Outlook", svg: "/icons/outlook.svg" },
  { name: "Slack", svg: "/icons/slack.svg" },
  { name: "Teams", svg: "/icons/teams.svg" },
  { name: "WhatsApp", svg: "/icons/whatsapp.svg" },
  { name: "Shopify", svg: "/icons/shopify.svg" },
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
        {integrations.map((int) => (
          <motion.div
            key={int.name}
            className="group flex flex-col items-center gap-2 cursor-default"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.15 }}
          >
            <Image
              src={int.svg}
              alt={int.name}
              width={28}
              height={28}
              className="opacity-40 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="text-[10px] text-[var(--text-tertiary)] opacity-40 group-hover:opacity-100 transition-opacity duration-300">
              {int.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
