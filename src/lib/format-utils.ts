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
 * Format amount based on project creation date
 * Projects created before 2023-01-01 are displayed in HRK, otherwise in EUR
 */
export function formatAmount(
  amount: number | null,
  projectCreatedAt: string | Date | number | null
): string {
  if (!amount) return "—";

  // If project created before 1.1.2023, display in HRK, otherwise display in EUR
  if (projectCreatedAt && new Date(projectCreatedAt) < new Date("2023-01-01")) {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "HRK",
    }).format(amount);
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(amount);
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

  return { label, link };
}
