"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      params.delete("page"); // reset to page 1 on new search
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-12 h-12 text-base bg-white"
      />
    </div>
  );
}
