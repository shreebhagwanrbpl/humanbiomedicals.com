"use client";

import { motion } from "framer-motion";

export default function PageBanner({ title, subtitle, badge = "Raj Biosis" }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f5fcfd] via-white to-[#eaf9fa] py-20 lg:py-28 border-b border-[#bfe8ea]/60">
      {/* Background Subtle Spheres & Mesh */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#007f86]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#00656a]/10 blur-3xl" />

      {/* Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(#007f860d_1px,transparent_1px),linear-gradient(90deg,#007f860d_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#007f86]/30 bg-[#d9f3f5]/80 px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-[#00656a] shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#007f86]" />
            {badge}
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-[#12383a] sm:text-5xl lg:text-6xl leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-[#12383a]">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}