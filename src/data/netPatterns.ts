import type { NetPattern } from '../core/types';

export const NET_PATTERNS: NetPattern[] = [
  { id: 1, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 0, to: 4, dir: 'up' },
    { from: 0, to: 5, dir: 'down' },
  ]},
  { id: 2, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 1, to: 4, dir: 'down' },
    { from: 0, to: 5, dir: 'up' },
  ]},
  { id: 3, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 0, to: 4, dir: 'up' },
    { from: 2, to: 5, dir: 'down' },
  ]},
  { id: 4, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 0, to: 4, dir: 'up' },
    { from: 3, to: 5, dir: 'down' },
  ]},
  { id: 5, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 1, to: 4, dir: 'up' },
    { from: 1, to: 5, dir: 'down' },
  ]},
  { id: 6, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 2, to: 3, dir: 'right' }, { from: 1, to: 4, dir: 'up' },
    { from: 2, to: 5, dir: 'down' },
  ]},
  { id: 7, structure: [
    { from: 0, to: 1, dir: 'left' }, { from: 0, to: 2, dir: 'right' },
    { from: 1, to: 3, dir: 'up' }, { from: 3, to: 4, dir: 'left' },
    { from: 2, to: 5, dir: 'down' },
  ]},
  { id: 8, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 0, to: 3, dir: 'up' }, { from: 3, to: 4, dir: 'left' },
    { from: 0, to: 5, dir: 'down' },
  ]},
  { id: 9, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'right' },
    { from: 0, to: 3, dir: 'up' }, { from: 3, to: 4, dir: 'left' },
    { from: 1, to: 5, dir: 'down' },
  ]},
  { id: 10, structure: [
    { from: 0, to: 1, dir: 'left' }, { from: 1, to: 2, dir: 'left' },
    { from: 0, to: 3, dir: 'down' }, { from: 3, to: 4, dir: 'right' },
    { from: 4, to: 5, dir: 'right' },
  ]},
  { id: 11, structure: [
    { from: 0, to: 1, dir: 'right' }, { from: 1, to: 2, dir: 'down' },
    { from: 2, to: 3, dir: 'right' }, { from: 3, to: 4, dir: 'down' },
    { from: 4, to: 5, dir: 'right' },
  ]},
];
