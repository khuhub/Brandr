import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function getRiskColor(score: number): string {
  if (score >= 60) return "text-red-600 bg-red-100";
  if (score >= 30) return "text-yellow-600 bg-yellow-100";
  return "text-green-600 bg-green-100";
}

export function getAlignmentColor(score: number): string {
  if (score >= 70) return "text-green-600 bg-green-100";
  if (score >= 40) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}
