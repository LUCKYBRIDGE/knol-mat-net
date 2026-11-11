import type { Direction, NetData } from '../types';
import { oppositeDirection } from './generateNets';

export interface EdgeRef {
  faceId: number;
  dir: Direction;
}

export interface PaperEdge {
  id: string;
  kind: 'hinge' | 'cut';
  refs: EdgeRef[];
  matchId?: number;
}

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

export const buildPaperEdges = (net: NetData): PaperEdge[] => {
  const byId = new Map(net.faces.map((face) => [face.id, face]));
  const hingeByRef = new Map<string, string>();

  for (const child of net.faces) {
    if (child.parentId === undefined || !child.attachDir) continue;
    const id = `hinge:${child.parentId}-${child.id}`;
    hingeByRef.set(`${child.parentId}|${child.attachDir}`, id);
    hingeByRef.set(`${child.id}|${oppositeDirection(child.attachDir)}`, id);
  }

  const hinges = new Map<string, PaperEdge>();
  const cuts: PaperEdge[] = [];
  for (const face of net.faces) {
    for (const dir of DIRECTIONS) {
      const hingeId = hingeByRef.get(`${face.id}|${dir}`);
      if (hingeId) {
        const edge = hinges.get(hingeId) ?? { id: hingeId, kind: 'hinge' as const, refs: [] };
        edge.refs.push({ faceId: face.id, dir });
        hinges.set(hingeId, edge);
      } else {
        cuts.push({
          id: `cut:${face.id}:${dir}`,
          kind: 'cut',
          refs: [{ faceId: face.id, dir }],
          matchId: byId.get(face.id)?.edgeMatchIds?.[dir],
        });
      }
    }
  }
  return [...hinges.values(), ...cuts];
};
