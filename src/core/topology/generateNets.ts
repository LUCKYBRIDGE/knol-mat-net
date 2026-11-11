import { NET_PATTERNS } from '../../data/netPatterns';
import type { Dimensions, Direction, EdgeMatch, Face, NetData } from '../types';

type Vec3 = [number, number, number];

interface FaceState {
  origin: Vec3;
  right: Vec3;
  down: Vec3;
  normal: Vec3;
  w: number;
  h: number;
  d: number;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

export const oppositeDirection = (dir: Direction): Direction => {
  switch (dir) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
};

const generateNet = (
  patternId: number,
  pattern: Array<{ from: number; to: number; dir: Direction }>,
  start: [number, number, number],
  variantIndex: number,
): NetData | null => {
  const faces: Face[] = [];
  const states: FaceState[] = [];
  const foldRefs = new Set<string>();
  const [l, w, h] = start;

  faces.push({ id: 0, x: 0, y: 0, width: l, height: w, isBase: true, sideId: 0 });
  states[0] = {
    origin: [0, 0, 0], right: [1, 0, 0], down: [0, 1, 0], normal: [0, 0, -1],
    w: l, h: w, d: h,
  };

  for (const link of pattern) {
    const parent = faces.find((face) => face.id === link.from);
    const ps = states[link.from];
    if (!parent || !ps) return null;

    let ns: FaceState;
    let x = parent.x;
    let y = parent.y;

    switch (link.dir) {
      case 'right':
        ns = {
          origin: add(ps.origin, scale(ps.right, ps.w)),
          right: ps.normal, down: ps.down, normal: scale(ps.right, -1),
          w: ps.d, h: ps.h, d: ps.w,
        };
        x += parent.width;
        break;
      case 'left':
        ns = {
          origin: [0, 0, 0], right: scale(ps.normal, -1), down: ps.down, normal: ps.right,
          w: ps.d, h: ps.h, d: ps.w,
        };
        ns.origin = add(ps.origin, scale(ns.right, -ns.w));
        x -= ns.w;
        break;
      case 'down':
        ns = {
          origin: add(ps.origin, scale(ps.down, ps.h)),
          right: ps.right, down: ps.normal, normal: scale(ps.down, -1),
          w: ps.w, h: ps.d, d: ps.h,
        };
        y += parent.height;
        break;
      case 'up':
        ns = {
          origin: [0, 0, 0], right: ps.right, down: scale(ps.normal, -1), normal: ps.down,
          w: ps.w, h: ps.d, d: ps.h,
        };
        ns.origin = add(ps.origin, scale(ns.down, -ns.h));
        y -= ns.h;
        break;
    }

    const face: Face = {
      id: link.to, x, y, width: ns.w, height: ns.h,
      parentId: link.from, attachDir: link.dir, sideId: -1,
    };

    const overlaps = faces.some((other) =>
      other.x < face.x + face.width - 0.05 &&
      other.x + other.width > face.x + 0.05 &&
      other.y < face.y + face.height - 0.05 &&
      other.y + other.height > face.y + 0.05
    );
    if (overlaps) return null;

    foldRefs.add(`${link.from}|${link.dir}`);
    foldRefs.add(`${link.to}|${oppositeDirection(link.dir)}`);
    faces.push(face);
    states[link.to] = ns;
  }

  const edgeMap = new Map<string, Array<{ faceId: number; dir: Direction }>>();
  for (const face of faces) {
    const s = states[face.id];
    const c0 = s.origin;
    const c1 = add(c0, scale(s.right, s.w));
    const c2 = add(c1, scale(s.down, s.h));
    const c3 = add(c0, scale(s.down, s.h));
    const edges: Array<{ dir: Direction; points: [Vec3, Vec3] }> = [
      { dir: 'up', points: [c0, c1] }, { dir: 'right', points: [c1, c2] },
      { dir: 'down', points: [c2, c3] }, { dir: 'left', points: [c3, c0] },
    ];

    for (const edge of edges) {
      const rounded = edge.points.map((p) => p.map((value) => {
        if (Math.abs(value) < 1e-6) return 0;
        return Math.round(value * 1e6) / 1e6;
      }) as Vec3);
      const [a, b] = rounded.sort((p1, p2) => p1[0] - p2[0] || p1[1] - p2[1] || p1[2] - p2[2]);
      const key = `${a.join(',')}|${b.join(',')}`;
      const refs = edgeMap.get(key) ?? [];
      refs.push({ faceId: face.id, dir: edge.dir });
      edgeMap.set(key, refs);
    }
  }

  faces.forEach((face) => { face.edgeMatchIds = {}; });
  const edgeMatches: EdgeMatch[] = [];
  let matchId = 0;
  for (const refs of edgeMap.values()) {
    if (refs.length !== 2) continue;
    const [a, b] = refs;
    if (foldRefs.has(`${a.faceId}|${a.dir}`) || foldRefs.has(`${b.faceId}|${b.dir}`)) continue;
    edgeMatches.push({ face1Id: a.faceId, edge1: a.dir, face2Id: b.faceId, edge2: b.dir, matchId });
    faces.find((face) => face.id === a.faceId)!.edgeMatchIds![a.dir] = matchId;
    faces.find((face) => face.id === b.faceId)!.edgeMatchIds![b.dir] = matchId;
    matchId += 1;
  }

  const minX = Math.min(...faces.map((face) => face.x));
  const minY = Math.min(...faces.map((face) => face.y));
  const maxX = Math.max(...faces.map((face) => face.x + face.width));
  const maxY = Math.max(...faces.map((face) => face.y + face.height));

  return {
    id: `${patternId}-${variantIndex}`, patternId, variantIndex,
    faces: faces.map((face) => {
      const n = states[face.id].normal;
      let sideId = 0;
      if (Math.abs(n[2]) > 0.1) sideId = n[2] > 0 ? 0 : 1;
      else if (Math.abs(n[1]) > 0.1) sideId = n[1] > 0 ? 2 : 3;
      else if (Math.abs(n[0]) > 0.1) sideId = n[0] > 0 ? 4 : 5;
      return { ...face, x: face.x - minX, y: face.y - minY, sideId };
    }),
    totalWidth: maxX - minX, totalHeight: maxY - minY, minX, minY, edgeMatches,
  };
};

export const generateAllNets = (dimensions: Dimensions, isCube: boolean): NetData[] => {
  const results: NetData[] = [];
  if (isCube) {
    const p: [number, number, number] = [dimensions.l, dimensions.l, dimensions.l];
    NET_PATTERNS.forEach((pattern) => {
      const net = generateNet(pattern.id, pattern.structure, p, 1);
      if (net) results.push(net);
    });
  } else {
    const { l, w, h } = dimensions;
    const variants: Array<[number, number, number]> = [
      [l, w, h], [l, h, w], [w, l, h], [w, h, l], [h, l, w], [h, w, l],
    ];
    NET_PATTERNS.forEach((pattern) => variants.forEach((variant, index) => {
      const net = generateNet(pattern.id, pattern.structure, variant, index + 1);
      if (net) results.push(net);
    }));
  }
  return results.sort((a, b) => a.patternId - b.patternId || a.variantIndex - b.variantIndex);
};
