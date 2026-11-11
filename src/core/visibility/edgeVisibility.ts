import * as THREE from 'three';
import type { FacePose } from '../geometry/foldKinematics';
import type { WorldEdge } from '../geometry/edgeGeometry';

export interface VisibilityInterval {
  start: number;
  end: number;
  visible: boolean;
}

export interface VisibilityOptions {
  sampleStepPx?: number;
  minSamples?: number;
  maxSamples?: number;
  boundaryIterations?: number;
  worldEpsilon?: number;
}

const DEFAULTS: Required<VisibilityOptions> = {
  sampleStepPx: 1,
  minSamples: 8,
  maxSamples: 512,
  boundaryIterations: 8,
  worldEpsilon: 1e-5,
};

const ray = new THREE.Ray();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const samplePoint = new THREE.Vector3();
const projectedA = new THREE.Vector3();
const projectedB = new THREE.Vector3();

const projectedLengthPx = (
  edge: WorldEdge,
  camera: THREE.PerspectiveCamera,
  viewport: { width: number; height: number },
) => {
  projectedA.copy(edge.start).project(camera);
  projectedB.copy(edge.end).project(camera);
  const ax = (projectedA.x * 0.5 + 0.5) * viewport.width;
  const ay = (-projectedA.y * 0.5 + 0.5) * viewport.height;
  const bx = (projectedB.x * 0.5 + 0.5) * viewport.width;
  const by = (-projectedB.y * 0.5 + 0.5) * viewport.height;
  return Math.hypot(bx - ax, by - ay);
};

export const isPointVisible = (
  point: THREE.Vector3,
  poses: Iterable<FacePose>,
  camera: THREE.PerspectiveCamera,
  epsilon: number,
): boolean => {
  camera.getWorldPosition(rayOrigin);
  const targetDistance = rayOrigin.distanceTo(point);
  if (targetDistance <= epsilon) return true;
  rayDirection.copy(point).sub(rayOrigin).normalize();
  ray.set(rayOrigin, rayDirection);

  for (const pose of poses) {
    const [a, b, c, d] = pose.corners;
    let hit = ray.intersectTriangle(a, b, c, false, hitPoint);
    if (hit && rayOrigin.distanceTo(hit) < targetDistance - epsilon) return false;
    hit = ray.intersectTriangle(a, c, d, false, hitPoint);
    if (hit && rayOrigin.distanceTo(hit) < targetDistance - epsilon) return false;
  }
  return true;
};

const refineBoundary = (
  edge: WorldEdge,
  leftT: number,
  rightT: number,
  leftVisible: boolean,
  poses: Iterable<FacePose>,
  camera: THREE.PerspectiveCamera,
  iterations: number,
  epsilon: number,
) => {
  let left = leftT;
  let right = rightT;
  for (let i = 0; i < iterations; i += 1) {
    const mid = (left + right) / 2;
    samplePoint.copy(edge.start).lerp(edge.end, mid);
    const visible = isPointVisible(samplePoint, poses, camera, epsilon);
    if (visible === leftVisible) left = mid;
    else right = mid;
  }
  return (left + right) / 2;
};

export const computeEdgeVisibility = (
  edge: WorldEdge,
  poses: Iterable<FacePose>,
  camera: THREE.PerspectiveCamera,
  viewport: { width: number; height: number },
  options: VisibilityOptions = {},
): VisibilityInterval[] => {
  const config = { ...DEFAULTS, ...options };
  const lengthPx = projectedLengthPx(edge, camera, viewport);
  const sampleCount = Math.min(
    config.maxSamples,
    Math.max(config.minSamples, Math.ceil(lengthPx / config.sampleStepPx)),
  );
  const poseList = Array.from(poses);
  const samples: Array<{ t: number; visible: boolean }> = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = i / sampleCount;
    samplePoint.copy(edge.start).lerp(edge.end, t);
    samples.push({ t, visible: isPointVisible(samplePoint, poseList, camera, config.worldEpsilon) });
  }

  const intervals: VisibilityInterval[] = [];
  let start = 0;
  let state = samples[0].visible;

  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].visible === state) continue;
    const boundary = refineBoundary(
      edge, samples[i - 1].t, samples[i].t, samples[i - 1].visible,
      poseList, camera, config.boundaryIterations, config.worldEpsilon,
    );
    intervals.push({ start, end: boundary, visible: state });
    start = boundary;
    state = samples[i].visible;
  }
  intervals.push({ start, end: 1, visible: state });
  return intervals;
};
