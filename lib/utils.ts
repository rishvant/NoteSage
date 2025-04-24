import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Note = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const demoNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to NoteSage',
    content: 'This is your first note. Feel free to edit or delete it.',
    summary: 'Welcome note for new users',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];