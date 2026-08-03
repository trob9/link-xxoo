import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border-2 border-border-strong bg-accent-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-secondary-ink",
        className,
      )}
      {...props}
    />
  );
}
