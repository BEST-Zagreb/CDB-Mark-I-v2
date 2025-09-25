/**
 * Formatting utilities for dates, amounts, and URLs
 */

/**
 * Format a date string or Date object to Croatian locale format
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "—";

  // Convert to Date object if it's a string
  let dateObj: Date;
  if (typeof date === "string") {
    if (date === "null" || date === "") return "—";
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "—";

  return new Intl.DateTimeFormat("hr-HR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format currency amount based on project creation/update date
 * Projects created/updated before 2023-01-01 are displayed in HRK, otherwise in EUR
 * Rounds to whole numbers with no decimals and adds comma separators for thousands
 * Returns empty string for null/undefined/empty values, "—" for 0
 */
export function formatCurrency(
  amount: number,
  projectDate?: Date | string | null
): string {
  // Return empty string for null, undefined, or empty values
  if (!amount || isNaN(amount) || amount === 0) {
    return "";
  }

  const roundedAmount = Math.round(amount);
  const formattedAmount = roundedAmount.toLocaleString("en-US");
  const dateToCheck = projectDate || new Date();
  const isOldProject = new Date(dateToCheck) < new Date("2023-01-01");

  if (isOldProject) {
    // HRK with symbol after number
    return `${formattedAmount} kn`;
  }

  // EUR with symbol after number (custom formatting)
  return `${formattedAmount} €`;
}

/**
 * Format URL to separate display label and actual link
 * If URL contains protocol, keep link same but remove protocol and www from label
 * If URL doesn't contain protocol, add https:// to link but keep original as label (minus www)
 */
export function formatUrl(url: string): { label: string; link: string } | null {
  if (!url || url === "null" || url === "") return null;

  let label = url;
  let link = url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    // If URL contains http or https, keep the link same but remove protocol from label
    link = url;
    label = url.replace(/^https?:\/\//, "");
  } else {
    // If URL doesn't contain http/https, add https:// to link but keep original as label
    label = url;
    link = `https://${url}`;
  }

  // Remove "www." from label for cleaner display
  label = label.replace(/^www\./, "");

  // Remove trailing slashes from label
  label = label.replace(/\/+$/, "");

  return { label, link };
}
