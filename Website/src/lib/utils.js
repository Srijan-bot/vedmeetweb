import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine static and conditional class names into a single string and resolve Tailwind utility conflicts.
 * @param {...any} inputs - Class names, arrays, objects, or conditional expressions to include in the final class list.
 * @returns {string} The merged class string with Tailwind utility conflicts resolved.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}