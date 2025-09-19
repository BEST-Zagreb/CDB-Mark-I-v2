import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database, FolderOpen, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Database className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to the new old Company Database
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A modern CRUD interface for managing your company&apos;s project
            data, built with Next.js, TypeScript, and SQLite.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                <CardTitle>Projects</CardTitle>
              </div>
              <CardDescription>
                View, create, edit, and delete projects in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects">
                <Button className="w-full">
                  Manage Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-muted-foreground">
                  More Features
                </CardTitle>
              </div>
              <CardDescription>
                Additional CRUD interfaces coming soon...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Built for hackathon projects • Minimal dependencies • Maximum
            efficiency
          </p>
        </div>
      </div>
    </div>
  );
}
