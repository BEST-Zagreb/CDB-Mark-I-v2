"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CompaniesPageHeaderProps {
  companiesCount: number;
  isMobile: boolean;
  onCreateCompany: () => void;
}

export function CompaniesPageHeader({
  companiesCount,
  isMobile,
  onCreateCompany,
}: CompaniesPageHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
          Companies
        </h1>
        <Badge variant="secondary">{companiesCount}</Badge>
      </div>
      <Button onClick={onCreateCompany} size={isMobile ? "sm" : "default"}>
        <Plus className="size-4" />
        New Company
      </Button>
    </div>
  );
}
