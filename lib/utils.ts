import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function extractMeetingLink(text: string): { platform: 'zoom' | 'meet' | 'teams' | null; url: string | null } {
  const zoomMatch = text.match(/https?:\/\/(?:[a-z0-9-]+\.)?zoom\.us\/[a-z]\/[0-9]+(?:\?pwd=[\w-]+)?/i)
  if (zoomMatch) {
    return { platform: 'zoom', url: zoomMatch[0] }
  }

  const meetMatch = text.match(/https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i)
  if (meetMatch) {
    return { platform: 'meet', url: meetMatch[0] }
  }

  const teamsMatch = text.match(/https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i)
  if (teamsMatch) {
    return { platform: 'teams', url: teamsMatch[0] }
  }

  return { platform: null, url: null }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

