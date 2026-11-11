import { describe, expect, it } from 'vitest';
import { generateAllNets } from '../topology/generateNets';
import { buildPaperEdges } from '../topology/edgeTopology';
import { buildWorldEdges, collapseMatchedEdges } from '../geometry/edgeGeometry';
import { computeFoldPoses } from '../geometry/foldKinematics';
import { validateClosure, validateTopology } from './validateNet';

describe('cube net topology and closure', () => {
  const nets = generateAllNets({ l: 2, w: 2, h: 2 }, true);

  it('generates all 11 canonical cube nets', () => {
    expect(nets).toHaveLength(11);
  });

  it.each(nets.map((net) => [net.id, net] as const))('%s has valid topology', (_id, net) => {
    expect(validateTopology(net)).toEqual([]);
  });

  it.each(nets.map((net) => [net.id, net] as const))('%s closes exactly at 100%', (_id, net) => {
    expect(validateClosure(net, 1e-6)).toEqual([]);
  });

  it.each(nets.map((net) => [net.id, net] as const))('%s becomes 12 physical edges when closed', (_id, net) => {
    const paperEdges = buildPaperEdges(net);
    expect(paperEdges).toHaveLength(19);
    const worldEdges = buildWorldEdges(net, paperEdges, computeFoldPoses(net, 100));
    expect(collapseMatchedEdges(worldEdges, 1e-6)).toHaveLength(12);
  });
});

describe('cuboid closure', () => {
  const nets = generateAllNets({ l: 3, w: 2, h: 1 }, false);

  it('all generated variants close correctly', () => {
    expect(nets.length).toBeGreaterThan(0);
    for (const net of nets) {
      expect(validateTopology(net), net.id).toEqual([]);
      expect(validateClosure(net, 1e-6), net.id).toEqual([]);
    }
  });
});
