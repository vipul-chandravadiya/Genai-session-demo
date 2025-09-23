import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBotAnswer(text: string): string {
  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert * list items to <ul><li>...</li></ul>
  // First, handle blocks of list items
  text = text.replace(/(?:^|\n)\* (.*?)(?=\n|$)/g, function (_match, p1) {
    return `\n<li>${p1.trim()}</li>`;
  });

  // Wrap consecutive <li> in <ul>
  text = text.replace(/(<li>.*?<\/li>\s*)+/gs, function (match) {
    return `<ul>${match}</ul>`;
  });

  // Convert double newlines to paragraph breaks
  text = text.replace(/\n\n+/g, '</p><p>');

  // Convert single newlines to <br>
  text = text.replace(/\n/g, '<br>');

  // Wrap in <p> if not already
  if (!/^<p>/.test(text)) text = `<p>${text}</p>`;

  return text;
}
