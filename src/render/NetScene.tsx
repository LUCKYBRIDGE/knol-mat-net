import { Line, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { NetData } from '../core/types';
import { buildPaperEdges } from '../core/topology/edgeTopology';
import { buildWorldEdges, collapseMatchedEdges, pointOnEdge } from '../core/geometry/edgeGeometry';
import { computeFoldPoses } from '../core/geometry/foldKinematics';
import { computeEdgeVisibility } from '../core/visibility/edgeVisibility';

interface NetSceneProps {
  net: NetData;
  foldProgress: number;
}

const Faces: React.FC<NetSceneProps> = ({ net, foldProgress }) => {
  const poses = useMemo(() => computeFoldPoses(net, foldProgress), [net, foldProgress]);

  return (
    <>
      {net.faces.map((face) => {
        const pose = poses.get(face.id);
        if (!pose) return null;
        return (
          <mesh key={face.id} matrix={pose.matrixWorld} matrixAutoUpdate={false}>
            <planeGeometry args={[face.width, face.height]} />
            <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        );
      })}
    </>
  );
};

const EdgeLayer: React.FC<{
  net: NetData;
  foldProgress: number;
  cameraRevision: number;
}> = ({ net, foldProgress, cameraRevision }) => {
  const { camera, size } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  const { poses, edges } = useMemo(() => {
    const nextPoses = computeFoldPoses(net, foldProgress);
    const paperEdges = buildPaperEdges(net);
    const worldEdges = buildWorldEdges(net, paperEdges, nextPoses);
    const maxDimension = Math.max(...net.faces.flatMap((face) => [face.width, face.height]));
    const nextEdges = foldProgress >= 99.999
      ? collapseMatchedEdges(worldEdges, Math.max(1e-8, maxDimension * 1e-6))
      : worldEdges;
    return { poses: nextPoses, edges: nextEdges };
  }, [net, foldProgress]);

  const visibility = useMemo(() => {
    perspectiveCamera.updateMatrixWorld(true);
    perspectiveCamera.updateProjectionMatrix();
    if (foldProgress <= 0) return new Map<string, ReturnType<typeof computeEdgeVisibility>>();
    const maxDimension = Math.max(...net.faces.flatMap((face) => [face.width, face.height]));
    const worldEpsilon = Math.max(1e-8, maxDimension * 1e-5);
    return new Map(edges.map((edge) => [
      edge.id,
      computeEdgeVisibility(edge, poses.values(), perspectiveCamera, size, { worldEpsilon }),
    ]));
  }, [cameraRevision, edges, foldProgress, net.faces, perspectiveCamera, poses, size]);

  if (foldProgress <= 0) {
    return (
      <>
        {edges.map((edge) => (
          <Line
            key={edge.id}
            points={[edge.start, edge.end]}
            color={edge.kind === 'hinge' ? '#64748b' : '#0f172a'}
            lineWidth={edge.kind === 'hinge' ? 1.5 : 2.5}
            dashed={edge.kind === 'hinge'}
            dashSize={0.12}
            gapSize={0.09}
            depthTest={false}
            renderOrder={10}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {edges.map((edge) => (
        <Line
          key={`hidden-${edge.id}`}
          points={[edge.start, edge.end]}
          color="#94a3b8"
          lineWidth={1.4}
          dashed
          dashSize={0.1}
          gapSize={0.08}
          depthTest={false}
          renderOrder={10}
        />
      ))}
      {edges.flatMap((edge) => (visibility.get(edge.id) ?? [])
        .filter((interval) => interval.visible && interval.end - interval.start > 1e-6)
        .map((interval, index) => (
          <Line
            key={`visible-${edge.id}-${index}`}
            points={[
              pointOnEdge(edge, interval.start, new THREE.Vector3()),
              pointOnEdge(edge, interval.end, new THREE.Vector3()),
            ]}
            color="#0f172a"
            lineWidth={2.5}
            depthTest={false}
            renderOrder={20}
          />
        )))}
    </>
  );
};

const SceneContents: React.FC<NetSceneProps & {
  onCameraChange: () => void;
  cameraRevision: number;
}> = ({ net, foldProgress, onCameraChange, cameraRevision }) => (
  <>
    <ambientLight intensity={1.2} />
    <directionalLight position={[6, 8, 10]} intensity={1.5} />
    <Faces net={net} foldProgress={foldProgress} />
    <EdgeLayer net={net} foldProgress={foldProgress} cameraRevision={cameraRevision} />
    <OrbitControls makeDefault enableDamping={false} onChange={onCameraChange} />
  </>
);

export const NetScene: React.FC<NetSceneProps> = ({ net, foldProgress }) => {
  const [cameraRevision, setCameraRevision] = useState(0);
  const rafPending = useRef(false);

  const handleCameraChange = () => {
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      setCameraRevision((value) => value + 1);
    });
  };

  return (
    <Canvas camera={{ position: [0, 0, 14], fov: 42, near: 0.1, far: 100 }} dpr={[1, 2]}>
      <color attach="background" args={['#f8fafc']} />
      <SceneContents
        net={net}
        foldProgress={foldProgress}
        onCameraChange={handleCameraChange}
        cameraRevision={cameraRevision}
      />
    </Canvas>
  );
};
