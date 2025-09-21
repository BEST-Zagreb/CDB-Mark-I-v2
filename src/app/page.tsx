import { Database } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto w-fit text-pretty flex items-center justify-center gap-6 mt-[30dvh]">
      <Database className="size-8 sm:size-24 text-primary shrink-0" />

      <div className="flex flex-col items-center justify-center">
        <h2 className="text-md sm:text-3xl">Welcome to the new old </h2>

        <h1 className="text-lg sm:text-5xl font-bold grow-0">
          Company Database
        </h1>
      </div>
    </div>
  );
}
