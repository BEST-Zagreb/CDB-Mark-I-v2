"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BlocksWaveLoaderProps {
  size?: number | string;
  className?: string;
  text?: string;
}

export function BlocksWaveLoader({
  size = 48,
  className,
  text,
}: BlocksWaveLoaderProps) {
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <div className="relative" style={{ width: sizeValue, height: sizeValue }}>
        <Image
          src="/blocks-wave.svg"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
      {text && <p className={cn("text-sm text-muted-foreground")}>{text}</p>}
    </div>
  );
}
