import * as THREE from "three";

// Arena is where the player stands and can move freely; the corridor is
// where enemies spawn and run from. The "breach point" marks the arena
// edge / corridor mouth — an enemy reaching it means it got through.
export function buildLevel(scene) {
  const arena = { minX: -8, maxX: 8, minZ: -8, maxZ: 5 };
  const corridor = { halfWidth: 2, startZ: 5, endZ: 45 };
  const corridorLength = corridor.endZ - corridor.startZ;
  const wallHeight = 4;

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d4a5c, roughness: 0.9 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({ color: 0x2f3a47, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5b6b82, roughness: 0.8 });
  const corridorWallMat = new THREE.MeshStandardMaterial({ color: 0x475264, roughness: 0.85 });

  const arenaFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(arena.maxX - arena.minX, arena.maxZ - arena.minZ),
    floorMat
  );
  arenaFloor.rotation.x = -Math.PI / 2;
  arenaFloor.position.set((arena.minX + arena.maxX) / 2, 0, (arena.minZ + arena.maxZ) / 2);
  arenaFloor.receiveShadow = true;
  scene.add(arenaFloor);

  const corridorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(corridor.halfWidth * 2, corridorLength),
    corridorFloorMat
  );
  corridorFloor.rotation.x = -Math.PI / 2;
  corridorFloor.position.set(0, 0, corridor.startZ + corridorLength / 2);
  corridorFloor.receiveShadow = true;
  scene.add(corridorFloor);

  function addWall(w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // Arena back + side walls
  addWall(arena.maxX - arena.minX, wallHeight, 0.3, 0, wallHeight / 2, arena.minZ, wallMat);
  addWall(0.3, wallHeight, arena.maxZ - arena.minZ, arena.minX, wallHeight / 2, (arena.minZ + arena.maxZ) / 2, wallMat);
  addWall(0.3, wallHeight, arena.maxZ - arena.minZ, arena.maxX, wallHeight / 2, (arena.minZ + arena.maxZ) / 2, wallMat);

  // Front wall, split around the corridor mouth
  const leftFrontWidth = corridor.halfWidth - arena.minX;
  addWall(leftFrontWidth, wallHeight, 0.3, arena.minX + leftFrontWidth / 2, wallHeight / 2, arena.maxZ, wallMat);
  const rightFrontWidth = arena.maxX - corridor.halfWidth;
  addWall(rightFrontWidth, wallHeight, 0.3, corridor.halfWidth + rightFrontWidth / 2, wallHeight / 2, arena.maxZ, wallMat);

  // Corridor side walls
  addWall(0.3, wallHeight, corridorLength, -corridor.halfWidth, wallHeight / 2, corridor.startZ + corridorLength / 2, corridorWallMat);
  addWall(0.3, wallHeight, corridorLength, corridor.halfWidth, wallHeight / 2, corridor.startZ + corridorLength / 2, corridorWallMat);

  // Lighting — soft hemisphere fill + a shadow-casting key light, tuned for
  // clean flat-shaded low-poly geometry rather than photoreal detail.
  const hemi = new THREE.HemisphereLight(0xbfd6ff, 0x33302b, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
  sun.position.set(10, 18, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -15;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  scene.add(sun);

  scene.background = new THREE.Color(0x1b2230);
  scene.fog = new THREE.Fog(0x1b2230, 20, 55);

  const bounds = {
    minX: arena.minX + 0.6,
    maxX: arena.maxX - 0.6,
    minZ: arena.minZ + 0.6,
    maxZ: arena.maxZ - 0.6,
  };

  const breachPoint = new THREE.Vector3(0, 0, arena.maxZ);
  const spawnPoints = [-1.2, 0, 1.2].map((x) => new THREE.Vector3(x, 0, corridor.endZ - 3));

  return { bounds, breachPoint, spawnPoints };
}
