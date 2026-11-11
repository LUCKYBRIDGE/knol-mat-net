import type { NetData } from '../types';
import { buildPaperEdges } from '../topology/edgeTopology';
import { buildWorldEdges } from '../geometry/edgeGeometry';
import { computeFoldPoses } from '../geometry/foldKinematics';

export interface ValidationIssue {
  code: string;
  message: string;
}

export const validateTopology = (net: NetData): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const edges = buildPaperEdges(net);
  const hinges = edges.filter((edge) => edge.kind === 'hinge');
  const cuts = edges.filter((edge) => edge.kind === 'cut');
  if (net.faces.length !== 6) issues.push({ code: 'FACE_COUNT', message: `Expected 6 faces, got ${net.faces.length}` });
  if (hinges.length !== 5) issues.push({ code: 'HINGE_COUNT', message: `Expected 5 hinges, got ${hinges.length}` });
  if (cuts.length !== 14) issues.push({ code: 'CUT_COUNT', message: `Expected 14 cut edges, got ${cuts.length}` });
  if (net.edgeMatches.length !== 7) issues.push({ code: 'MATCH_COUNT', message: `Expected 7 edge matches, got ${net.edgeMatches.length}` });
  for (const edge of hinges) {
    if (edge.refs.length !== 2) issues.push({ code: 'HINGE_REF_COUNT', message: `${edge.id} has ${edge.refs.length} refs` });
  }
  return issues;
};

export const validateClosure = (net: NetData, epsilon = 1e-6): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const paperEdges = buildPaperEdges(net);
  const poses = computeFoldPoses(net, 100);
  const worldEdges = buildWorldEdges(net, paperEdges, poses);
  const matched = new Map<number, typeof worldEdges>();

  for (const edge of worldEdges) {
    if (edge.kind !== 'cut' || edge.matchId === undefined) continue;
    const list = matched.get(edge.matchId) ?? [];
    list.push(edge);
    matched.set(edge.matchId, list);
  }

  for (let matchId = 0; matchId < net.edgeMatches.length; matchId += 1) {
    const pair = matched.get(matchId) ?? [];
    if (pair.length !== 2) {
      issues.push({ code: 'MATCH_PAIR_COUNT', message: `match ${matchId} has ${pair.length} world edges` });
      continue;
    }
    const [a, b] = pair;
    const direct = Math.max(a.start.distanceTo(b.start), a.end.distanceTo(b.end));
    const reversed = Math.max(a.start.distanceTo(b.end), a.end.distanceTo(b.start));
    if (Math.min(direct, reversed) > epsilon) {
      issues.push({ code: 'CLOSURE_MISMATCH', message: `match ${matchId} misses by ${Math.min(direct, reversed)}` });
    }
  }
  return issues;
};
