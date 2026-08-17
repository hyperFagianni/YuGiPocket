import { Asset } from 'expo-asset';
import * as THREE from 'three';

/**
 * three.js's stock TextureLoader relies on a DOM Image, which doesn't exist in React Native.
 * expo-gl's texImage2D natively understands `{ localUri, width, height }`-shaped sources, so we
 * just need to resolve the bundled asset to a local file and hand that shape to a bare THREE.Texture.
 */
export async function loadLocalTexture(moduleId: number): Promise<THREE.Texture> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();

  const texture = new THREE.Texture();
  texture.image = { localUri: asset.localUri ?? asset.uri, width: asset.width, height: asset.height };
  texture.needsUpdate = true;
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
