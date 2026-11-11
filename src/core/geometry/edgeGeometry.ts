import * as THREE from 'three';
import type { Direction, Face, NetData } from '../types';
import type { FacePose } from './foldKinematics';
import type { PaperEdge } from '../topology/edgeTopology';

export interface WorldEdge {
  id: string;
  kind: 'hinge' | 'cut';
  start: THREE.Vector3;
  end: THREE.Vector3;
  refs: PaperEdge['refs'];
  matchId?: number;
}

export const getLocalEdgePoints = (face: Face, dir: Direction): [THREE.Vector3, THREE.Vector3] => {
  const hw = face.width / 2;
  const hh = face.height / 2;
  switch (dir) {
    case 'up': return [new THREE.Vector3(-hw, hh, 0), new THREE.Vector3(hw, hh, 0)];
    case 'right': return [new THREE.Vector3(hw, hh, 0), new THREE.Vector3(hw, -hh, 0)];
    case 'down': return [new THREE.Vector3(hw, -hh, 0), new THREE.Vector3(-hw, -hh, 0)];
    case 'left': return [new THREE.Vector3(-hw, -hh, 0), new THREE.Vector3(-hw, hh, 0)];
  }
};

export const buildWorldEdges = (
  net: NetData,
  paperEdges: PaperEdge[],
  poses: Map<number, FacePose>,
): WorldEdge[] => {
  const faceById = new Map(net.faces.map((face) => [face.id, face]));
  return paperEdges.map((edge) => {
    const ref = edge.refs[0];
    const face = faceById.get(ref.faceId);
    const pose = poses.get(ref.faceId);
    if (!face || !pose) throw new Error(`Missing face pose for edge ${edge.id}`);
    const [localStart, localEnd] = getLocalEdgePoints(face, ref.dir);
    return {
      id: edge.id,
      kind: edge.kind,
      start: localStart.applyMatrix4(pose.matrixWorld),
      end: localEnd.applyMatrix4(pose.matrixWorld),
      refs: edge.refs,
      matchId: edge.matchId,
    };
  });
};

const sameSegment = (a: WorldEdge, b: WorldEdge, epsilon: number) => {
  const direct = a.start.distanceTo(b.start) <= epsilon && a.end.distanceTo(b.end) <= epsilon;
  const reversed = a.start.distanceTo(b.end) <= epsilon && a.end.distanceTo(b.start) <= epsilon;
  return direct || reversed;
};

export const collapseMatchedEdges = (edges: WorldEdge[], epsilon: number): WorldEdge[] => {
  const result: WorldEdge[] = [];
  const grouped = new Map<number, WorldEdge[]>();

  for (const edge of edges) {
    if (edge.kind !== 'cut' || edge.matchId === undefined) {
      result.push(edge);
      continue;
    }
    const list = grouped.get(edge.matchId) ?? [];
    list.push(edge);
    grouped.set(edge.matchId, list);
  }

  for (const [matchId, group] of grouped) {
    if (group.length === 2 && sameSegment(group[0], group[1], epsilon)) {
      result.push({ ...group[0], id: `matched:${matchId}`, refs: [...group[0].refs, ...group[1].refs] });
    } else {
      result.push(...group);
    }
  }
  return result;
};

export const pointOnEdge = (edge: WorldEdge, t: number, target = new THREE.Vector3()) =>
  target.copy(edge.start).lerp(edge.end, t);
