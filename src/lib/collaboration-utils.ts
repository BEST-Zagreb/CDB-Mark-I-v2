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
// Status (successful field): null = Pending, true = Successful, false = Rejected
// For sorting: Successful (true) > Pending (null) > Rejected (false)
export function getStatusPriority(collaboration: Collaboration): number {
  if (collaboration.successful === true) return 2; // Successful
  if (collaboration.successful === null) return 1; // Pending
  if (collaboration.successful === false) return 0; // Rejected
  return 1; // Default to Pending
}

// Helper function to get progress priority for sorting
// Progress indicators: contacted, letter, meeting
// Higher number = more progress. Meeting > Letter > Contacted > None
export function getProgressPriority(collaboration: Collaboration): number {
  let priority = 0;
  if (collaboration.contacted) priority += 1;
  if (collaboration.letter) priority += 2;
  if (collaboration.meeting) priority += 4;
  return priority; // Range: 0-7 based on combination of flags
}
