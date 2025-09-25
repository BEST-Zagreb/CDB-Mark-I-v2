"use client";

import { useState, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Company } from "@/types/company";

interface UseVirtualizedCompaniesProps {
  companies: Company[];
  searchQuery: string;
  containerRef: React.RefObject<HTMLElement>;
  batchSize?: number;
}

export function useVirtualizedCompanies({
  companies,
  searchQuery,
  containerRef,
  batchSize = 30,
}: UseVirtualizedCompaniesProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase();
    return companies.filter((company) => {
      return (
        company.name?.toLowerCase().includes(query) ||
        company.city?.toLowerCase().includes(query) ||
        company.country?.toLowerCase().includes(query) ||
        company.comment?.toLowerCase().includes(query)
      );
    });
  }, [companies, searchQuery]);

  // Get the visible companies (limited by visibleCount)
  const visibleCompanies = useMemo(() => {
    return filteredCompanies.slice(0, visibleCount);
  }, [filteredCompanies, visibleCount]);

  // Reset visible count when search query changes
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [searchQuery, batchSize]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: visibleCompanies.length,
    getScrollElement: () => document.documentElement,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 50, // Number of items to render outside of visible area
  });

  // Load more function
  const loadMore = () => {
    const newCount = Math.min(
      visibleCount + batchSize,
      filteredCompanies.length
    );
    setVisibleCount(newCount);
  };

  // Check if there are more items to load
  const hasMore = visibleCount < filteredCompanies.length;

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Load more when within 1000px of bottom
      if (distanceFromBottom < 2160) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, visibleCount, filteredCompanies.length]);

  return {
    filteredCompanies,
    visibleCompanies,
    rowVirtualizer,
    hasMore,
    loadMore,
    totalCount: filteredCompanies.length,
    visibleCount,
  };
}
