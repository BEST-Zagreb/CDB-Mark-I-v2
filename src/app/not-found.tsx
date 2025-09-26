"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-6xl font-bold">404</div>

            <div className="text-2xl">Hmm… well this is awkward. 😅</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>
              It seems that the page{" "}
              <span className="italic"> &quot;{pathname}&quot; </span> does not
              exist.
            </div>

            <div className="text-gray-600">
              Let&apos;s get you back on track!
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center mt-2 flex flex-wrap gap-4 items-center justify-center">
          <Button
            variant={"outline"}
            onClick={() => {
              router.back();
            }}
          >
            Go back
          </Button>

          <Button asChild className="text-pretty whitespace-wrap">
            <Link href="/" className="text-pretty whitespace-wrap">
              Go to Homepage
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
