"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Show at most 5 page buttons centered on the current page
  const delta = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${isPending ? "opacity-60" : ""}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </Button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => goTo(p as number)}
            disabled={isPending}
            className="w-9"
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className="gap-1"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
