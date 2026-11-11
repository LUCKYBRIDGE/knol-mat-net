export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Face {
  id: number;
  width: number;
  height: number;
  x: number;
  y: number;
  isBase?: boolean;
  parentId?: number;
  attachDir?: Direction;
  sideId?: number;
  edgeMatchIds?: Partial<Record<Direction, number>>;
}

export interface EdgeMatch {
  face1Id: number;
  edge1: Direction;
  face2Id: number;
  edge2: Direction;
  matchId: number;
}

export interface NetData {
  id: string;
  patternId: number;
  variantIndex: number;
  faces: Face[];
  totalWidth: number;
  totalHeight: number;
  minX: number;
  minY: number;
  edgeMatches: EdgeMatch[];
}

export interface Dimensions {
  l: number;
  w: number;
  h: number;
}

export interface NetPattern {
  id: number;
  structure: Array<{ from: number; to: number; dir: Direction }>;
}
