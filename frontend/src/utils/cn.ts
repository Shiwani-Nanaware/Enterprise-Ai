/**
 * Class name utility combining clsx and tailwind-merge.
 * Merges Tailwind classes intelligently, resolving conflicts.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind conflict resolution.
 *
 * @example
 * cn("px-4 py-2", condition && "bg-primary", "text-white")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
