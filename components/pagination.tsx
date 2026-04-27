"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const delta = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const navBtn =
    "flex items-center gap-1 liquid-glass rounded-full px-4 py-2 text-white/60 hover:text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className={`flex items-center justify-center gap-2 ${isPending ? "opacity-60" : ""}`}>
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className={navBtn}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      <div className="flex items-center gap-1 mx-2">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-white/20 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p as number)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === currentPage
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className={navBtn}
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
