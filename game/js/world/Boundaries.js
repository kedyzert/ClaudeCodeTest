import * as THREE from "three";

export function clampToBounds(position, bounds, margin = 0) {
  position.x = THREE.MathUtils.clamp(position.x, bounds.minX + margin, bounds.maxX - margin);
  position.z = THREE.MathUtils.clamp(position.z, bounds.minZ + margin, bounds.maxZ - margin);
  return position;
}
