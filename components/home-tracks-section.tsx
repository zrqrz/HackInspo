"use client";

import { motion } from "motion/react";
import { Brain, Landmark, HeartPulse, Leaf, Users, Terminal } from "lucide-react";

const tracks = [
  { icon: Brain,      name: "AI / ML",        color: "text-blue-400" },
  { icon: Landmark,   name: "FinTech",         color: "text-emerald-400" },
  { icon: HeartPulse, name: "HealthTech",      color: "text-rose-400" },
  { icon: Leaf,     name: "Sustainability",  color: "text-green-400" },
  { icon: Users,    name: "Social Good",     color: "text-purple-400" },
  { icon: Terminal, name: "Dev Tools",       color: "text-amber-400" },
];

export function HomeTracksSection() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl text-white tracking-tight mb-2">Browse by Track</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tracks.map((track, i) => (
            <motion.div
              key={track.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="liquid-glass rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-not-allowed group shadow-lg"
            >
              <div className={`p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors ${track.color}`}>
                <track.icon size={28} />
              </div>
              <span className="text-white text-sm font-medium text-center">{track.name}</span>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase">
                Soon
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
