"use client";

import { useState, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Collaboration } from "@/types/collaboration";

interface UseVirtualizedCollaborationsProps {
  collaborations: (Collaboration & {
    companyName?: string;
    projectName?: string;
    personName?: string;
  })[];
  searchQuery: string;
  containerRef: React.RefObject<HTMLElement>;
  batchSize?: number;
}

export function useVirtualizedCollaborations({
  collaborations,
  searchQuery,
  containerRef,
  batchSize = 30,
}: UseVirtualizedCollaborationsProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  // Filter collaborations based on search query
  const filteredCollaborations = useMemo(() => {
    if (!searchQuery.trim()) return collaborations;

    const query = searchQuery.toLowerCase();
    return collaborations.filter((collaboration) => {
      return (
        collaboration.companyName?.toLowerCase().includes(query) ||
        collaboration.projectName?.toLowerCase().includes(query) ||
        collaboration.personName?.toLowerCase().includes(query) ||
        collaboration.responsible?.toLowerCase().includes(query) ||
        collaboration.comment?.toLowerCase().includes(query) ||
        collaboration.type?.toLowerCase().includes(query)
      );
    });
  }, [collaborations, searchQuery]);

  // Get the visible collaborations (limited by visibleCount)
  const visibleCollaborations = useMemo(() => {
    return filteredCollaborations.slice(0, visibleCount);
  }, [filteredCollaborations, visibleCount]);

  // Reset visible count when search query changes
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [searchQuery, batchSize]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: visibleCollaborations.length,
    getScrollElement: () => document.documentElement,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 50, // Number of items to render outside of visible area
  });

  // Load more function
  const loadMore = () => {
    const newCount = Math.min(
      visibleCount + batchSize,
      filteredCollaborations.length
    );
    setVisibleCount(newCount);
  };

  // Check if there are more items to load
  const hasMore = visibleCount < filteredCollaborations.length;

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
  }, [hasMore, visibleCount, filteredCollaborations.length]);

  return {
    filteredCollaborations,
    visibleCollaborations,
    rowVirtualizer,
    hasMore,
    loadMore,
    totalCount: filteredCollaborations.length,
    visibleCount,
  };
}
