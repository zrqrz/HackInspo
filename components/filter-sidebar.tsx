"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, X } from "lucide-react";
import type { TagDTO } from "@/lib/types";

interface Props {
  topTags: TagDTO[];
}

const TEAM_SIZE_OPTIONS = [
  { label: "Solo",      value: 1 },
  { label: "2 people",  value: 2 },
  { label: "3 people",  value: 3 },
  { label: "4 people",  value: 4 },
  { label: "5+ people", value: 5 },
];

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterSidebar({ topTags }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedTags = searchParams.getAll("tags");
  const selectedSizes = searchParams.getAll("teamSize").map(Number);
  const hasFilters = selectedTags.length > 0 || selectedSizes.length > 0;

  function updateParam(key: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    if (checked) {
      if (!current.includes(value)) params.append(key, value);
    } else {
      params.delete(key);
      current.filter((v) => v !== value).forEach((v) => params.append(key, v));
    }
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    params.delete("teamSize");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <aside className="space-y-12">
      <div className="flex items-center gap-2 text-white/60 mb-8">
        <Filter size={18} />
        <span className="font-bold uppercase tracking-[0.2em] text-sm">Filters</span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-white/30 hover:text-white text-xs transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Tech Stack */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/30 mb-6">
          Tech Stack
        </h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {topTags.map((tag) => {
            const checked = selectedTags.includes(tag.slug);
            return (
              <label key={tag.slug} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => updateParam("tags", tag.slug, !checked)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    checked
                      ? "border-white bg-white"
                      : "border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {checked && <CheckIcon />}
                </div>
                <span
                  className={`text-sm font-mono transition-colors ${
                    checked ? "text-white" : "text-white/50 group-hover:text-white"
                  }`}
                >
                  {tag.name}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Team Size */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/30 mb-6">
          Team Size
        </h3>
        <div className="space-y-4">
          {TEAM_SIZE_OPTIONS.map(({ label, value }) => {
            const checked = selectedSizes.includes(value);
            return (
              <label key={value} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => updateParam("teamSize", String(value), !checked)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    checked
                      ? "border-white bg-white"
                      : "border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {checked && <CheckIcon />}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    checked ? "text-white" : "text-white/50 group-hover:text-white"
                  }`}
                >
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Difficulty — disabled until AI classification */}
      <section className="opacity-40 pointer-events-none select-none">
        <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/30 mb-6">
          Difficulty
        </h3>
        <div className="space-y-4">
          {["Beginner", "Intermediate", "Advanced"].map((d) => (
            <label key={d} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border border-white/20 shrink-0" />
              <span className="text-white/30 text-sm">{d}</span>
            </label>
          ))}
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-4 italic">
          Available after AI classification
        </p>
      </section>
    </aside>
  );
}
