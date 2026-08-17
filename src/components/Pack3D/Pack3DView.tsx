import { GLView } from 'expo-gl';
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as THREE from 'three';

import { PACK_THEMES, SIDE_TEXTURE } from '@/data/packThemes';
import { loadLocalTexture } from './textureLoader';

interface Props {
  setId: string;
  onPress: () => void;
  size?: number;
}

const IDLE_SPEED = 0.008;

export function Pack3DView({ setId, onPress, size = 220 }: Props) {
  const rotationYRef = useRef(0.3);
  const draggingRef = useRef(false);
  const dragStartRotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mesh: THREE.Mesh;
    gl: any;
  } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      sceneRef.current = null;
    };
  }, []);

  async function onContextCreate(gl: any) {
    const theme = PACK_THEMES[setId];
    if (!theme) return;

    const renderer = new THREE.WebGLRenderer({ context: gl, alpha: true });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    const [frontTexture, sideTexture] = await Promise.all([
      loadLocalTexture(theme.frontTexture),
      loadLocalTexture(SIDE_TEXTURE),
    ]);
    if (!mountedRef.current) return;

    const geometry = new THREE.BoxGeometry(1.4, 2.0, 0.12);
    const edgeMaterial = new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.7, metalness: 0.15 });
    const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.45, metalness: 0.1 });
    // Ordine facce di THREE.BoxGeometry: +x, -x, +y, -y, +z (fronte), -z (retro)
    const materials = [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, frontMaterial, edgeMaterial];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.rotation.y = rotationYRef.current;
    scene.add(mesh);

    sceneRef.current = { renderer, scene, camera, mesh, gl };

    const render = () => {
      if (!mountedRef.current || !sceneRef.current) return;
      rafRef.current = requestAnimationFrame(render);
      if (!draggingRef.current) {
        rotationYRef.current += IDLE_SPEED;
      }
      sceneRef.current.mesh.rotation.y = rotationYRef.current;
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      sceneRef.current.gl.endFrameEXP();
    };
    render();
  }

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      draggingRef.current = true;
      dragStartRotationRef.current = rotationYRef.current;
    })
    .onUpdate((e) => {
      rotationYRef.current = dragStartRotationRef.current + e.translationX * 0.012;
    })
    .onEnd(() => {
      draggingRef.current = false;
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => onPress());

  const composed = Gesture.Race(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composed}>
      <GLView style={[styles.glView, { width: size, height: size * (10 / 7) }]} onContextCreate={onContextCreate} />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  glView: {
    backgroundColor: 'transparent',
  },
});
