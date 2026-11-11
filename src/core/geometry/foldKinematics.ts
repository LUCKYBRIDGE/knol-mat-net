import * as THREE from 'three';
import type { Direction, Face, NetData } from '../types';

export interface FacePose {
  faceId: number;
  matrixWorld: THREE.Matrix4;
  corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  normal: THREE.Vector3;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getHingePosition = (parent: Face, dir: Direction): THREE.Vector3 => {
  switch (dir) {
    case 'right': return new THREE.Vector3(parent.width / 2, 0, 0);
    case 'left': return new THREE.Vector3(-parent.width / 2, 0, 0);
    case 'up': return new THREE.Vector3(0, parent.height / 2, 0);
    case 'down': return new THREE.Vector3(0, -parent.height / 2, 0);
  }
};

const getChildOffset = (child: Face, dir: Direction): THREE.Vector3 => {
  switch (dir) {
    case 'right': return new THREE.Vector3(child.width / 2, 0, 0);
    case 'left': return new THREE.Vector3(-child.width / 2, 0, 0);
    case 'up': return new THREE.Vector3(0, child.height / 2, 0);
    case 'down': return new THREE.Vector3(0, -child.height / 2, 0);
  }
};

const getRotationMatrix = (dir: Direction, angle: number): THREE.Matrix4 => {
  const rotation = new THREE.Matrix4();
  switch (dir) {
    case 'right': return rotation.makeRotationY(angle);
    case 'left': return rotation.makeRotationY(-angle);
    case 'up': return rotation.makeRotationX(-angle);
    case 'down': return rotation.makeRotationX(angle);
  }
};

const localCorners = (face: Face): [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] => [
  new THREE.Vector3(-face.width / 2, face.height / 2, 0),
  new THREE.Vector3(face.width / 2, face.height / 2, 0),
  new THREE.Vector3(face.width / 2, -face.height / 2, 0),
  new THREE.Vector3(-face.width / 2, -face.height / 2, 0),
];

export const computeFoldPoses = (net: NetData, foldProgress: number): Map<number, FacePose> => {
  const root = net.faces.find((face) => face.parentId === undefined) ?? net.faces[0];
  if (!root) return new Map();

  const children = new Map<number, Face[]>();
  for (const face of net.faces) {
    if (face.parentId === undefined) continue;
    const list = children.get(face.parentId) ?? [];
    list.push(face);
    children.set(face.parentId, list);
  }

  const angle = clamp01(foldProgress / 100) * Math.PI / 2;
  const poses = new Map<number, FacePose>();

  const visit = (face: Face, matrixWorld: THREE.Matrix4) => {
    const corners = localCorners(face).map((corner) => corner.applyMatrix4(matrixWorld)) as FacePose['corners'];
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(matrixWorld).normalize();
    poses.set(face.id, { faceId: face.id, matrixWorld: matrixWorld.clone(), corners, normal });

    for (const child of children.get(face.id) ?? []) {
      if (!child.attachDir) continue;
      const hinge = getHingePosition(face, child.attachDir);
      const offset = getChildOffset(child, child.attachDir);
      const relative = new THREE.Matrix4()
        .makeTranslation(hinge.x, hinge.y, hinge.z)
        .multiply(getRotationMatrix(child.attachDir, angle))
        .multiply(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));
      visit(child, matrixWorld.clone().multiply(relative));
    }
  };

  visit(root, new THREE.Matrix4().identity());
  return poses;
};
