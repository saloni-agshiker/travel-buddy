// clsx creates class names seamlessly
import { clsx } from "clsx";

// tailwind merge understands Tailwind CSS rules & removes conflicts
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
