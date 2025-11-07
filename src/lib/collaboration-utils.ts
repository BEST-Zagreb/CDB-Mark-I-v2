import { Collaboration } from "@/types/collaboration";

// Helper function to get priority order value for sorting
export function getPriorityOrder(priority: string): number {
  switch (priority) {
    case "High":
      return 3;
    case "Medium":
      return 2;
    case "Low":
      return 1;
    default:
      return 0;
  }
}

// Helper function to get status priority for sorting
export function getStatusPriority(collaboration: Collaboration): number {
  if (collaboration.successful) return 4;
  if (collaboration.meeting) return 3;
  if (collaboration.letter) return 2;
  if (collaboration.contacted) return 1;
  return 0; // Not contacted yet
}
