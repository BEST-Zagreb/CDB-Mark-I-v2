"use client";

import Image from "next/image";
import { Suspense } from "react";
import { AuthRequiredAlert } from "@/components/common/auth-required-alert";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4">
      <Suspense fallback={null}>
        <AuthRequiredAlert />
      </Suspense>

      <div className="w-fit text-pretty flex items-center justify-center gap-6 mt-[25dvh] mx-auto flex-wrap">
        <Image
          src="/cdb-logo-transparent.png"
          alt="Company DB logo by Ilona"
          width={512}
          height={512}
          className="shrink-0 w-32 sm:w-48"
        />

        <div className="flex flex-col items-center justify-center">
          <h2 className="text-md sm:text-3xl">Welcome to the new old </h2>

          <h1 className="text-lg sm:text-5xl font-bold grow-0">
            Company Database
          </h1>
        </div>
      </div>
    </div>
  );
}
