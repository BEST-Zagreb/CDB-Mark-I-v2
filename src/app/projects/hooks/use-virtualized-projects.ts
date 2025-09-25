"use client";

import { useState, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Project } from "@/types/project";

interface UseVirtualizedProjectsProps {
  projects: Project[];
  searchQuery: string;
  containerRef: React.RefObject<HTMLElement>;
  batchSize?: number;
}

export function useVirtualizedProjects({
  projects,
  searchQuery,
  containerRef,
  batchSize = 30,
}: UseVirtualizedProjectsProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase();

    return projects.filter((project) => {
      return project.name?.toLowerCase().includes(query);
    });
  }, [projects, searchQuery]);

  // Get the visible projects (limited by visibleCount)
  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleCount);
  }, [filteredProjects, visibleCount]);

  // Reset visible count when search query changes
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [searchQuery, batchSize]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: visibleProjects.length,
    getScrollElement: () => document.documentElement,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 50, // Number of items to render outside of visible area
  });

  // Load more function
  const loadMore = () => {
    const newCount = Math.min(
      visibleCount + batchSize,
      filteredProjects.length
    );
    setVisibleCount(newCount);
  };

  // Check if there are more items to load
  const hasMore = visibleCount < filteredProjects.length;

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
  }, [hasMore, visibleCount, filteredProjects.length]);

  return {
    filteredProjects,
    visibleProjects,
    rowVirtualizer,
    hasMore,
    loadMore,
    totalCount: filteredProjects.length,
    visibleCount,
  };
}
