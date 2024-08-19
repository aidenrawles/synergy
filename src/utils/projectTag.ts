import { Tags } from '../types/database-types';

/**
 * An array of available tags representing different technical skills or domains.
 */
export const TAGS: Tags[] = ['Backend', 'Frontend/UI', 'Database', 'AI', 'Cyber Security', 'DSA'];

/**
 * A dictionary that maps each tag to a specific color.
 */
export const colourDict: Record<Tags, string> = {
  Backend: 'yellow',
  'Frontend/UI': 'purple',
  Database: 'green',
  AI: 'red',
  'Cyber Security': 'blue',
  DSA: 'green',
};
