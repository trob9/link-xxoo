import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border-hard shadow-hard rounded-md p-5",
        className,
      )}
      {...props}
    />
  );
}
