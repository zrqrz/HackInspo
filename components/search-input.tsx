"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

interface Props {
  placeholder?: string;
  defaultValue?: string;
}

export function SearchInput({
  placeholder = "Search projects...",
  defaultValue = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="liquid-glass rounded-2xl p-4 flex items-center gap-4 border border-white/5 shadow-2xl">
      <Search className="text-white/30 ml-2 shrink-0" size={20} />
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/20 text-lg"
      />
    </div>
  );
}
