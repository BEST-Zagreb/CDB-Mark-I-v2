import { Database } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="flex items-center justify-center gap-4">
          <Database className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the new old Company Database
          </h1>
        </div>
      </div>
    </div>
  );
}
