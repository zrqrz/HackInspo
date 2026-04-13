"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { TagDTO } from "@/lib/types";

interface Props {
  topTags: TagDTO[];
}

const TEAM_SIZE_OPTIONS = [
  { label: "Solo", value: 1 },
  { label: "2 people", value: 2 },
  { label: "3 people", value: 3 },
  { label: "4 people", value: 4 },
  { label: "5+ people", value: 5 },
];

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
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <h2 className="font-semibold">Filters</h2>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
              <X className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Tech Stack */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wide">
            Tech Stack
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {topTags.map((tag) => (
              <div key={tag.slug} className="flex items-center gap-2">
                <Checkbox
                  id={`tag-${tag.slug}`}
                  checked={selectedTags.includes(tag.slug)}
                  onCheckedChange={(checked) =>
                    updateParam("tags", tag.slug, checked === true)
                  }
                />
                <Label
                  htmlFor={`tag-${tag.slug}`}
                  className="text-sm cursor-pointer font-mono"
                >
                  {tag.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Team Size */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wide">
            Team Size
          </h3>
          <div className="space-y-2">
            {TEAM_SIZE_OPTIONS.map(({ label, value }) => (
              <div key={value} className="flex items-center gap-2">
                <Checkbox
                  id={`size-${value}`}
                  checked={selectedSizes.includes(value)}
                  onCheckedChange={(checked) =>
                    updateParam("teamSize", String(value), checked === true)
                  }
                />
                <Label htmlFor={`size-${value}`} className="text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Difficulty — disabled until AI classification (Phase 1) */}
        <div className="opacity-40 pointer-events-none select-none">
          <h3 className="text-sm font-semibold mb-1 text-gray-500 uppercase tracking-wide">
            Difficulty
          </h3>
          <p className="text-xs text-gray-400 mb-3">Available after AI classification</p>
          {["Beginner", "Intermediate", "Advanced"].map((d) => (
            <div key={d} className="flex items-center gap-2 mb-2">
              <Checkbox id={`diff-${d}`} disabled />
              <Label htmlFor={`diff-${d}`} className="text-sm">{d}</Label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
