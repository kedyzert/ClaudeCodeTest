import * as THREE from "three";
import { EventBus } from "./utils/EventBus.js";
import { GameState, States } from "./core/GameState.js";
import { buildLevel } from "./world/Level.js";
import { PlayerController } from "./player/PlayerController.js";
import { createDefaultWeaponConfig } from "./weapons/WeaponConfig.js";
import { WeaponSystem } from "./weapons/WeaponSystem.js";
import { EnemyManager } from "./enemies/EnemyManager.js";
import { WaveManager } from "./waves/WaveManager.js";
import { UpgradeSystem } from "./upgrades/UpgradeSystem.js";
import { HUD } from "./ui/HUD.js";
import { MenuOverlay } from "./ui/MenuOverlay.js";
import { UpgradeOverlay } from "./ui/UpgradeOverlay.js";
import { GameOverOverlay } from "./ui/GameOverOverlay.js";

const canvas = document.getElementById("game-canvas");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
// The camera must be part of the scene graph so that objects parented to it
// (the weapon viewmodels) are traversed and rendered by renderer.render().
scene.add(camera);

const eventBus = new EventBus();
const gameState = new GameState(eventBus);

const { bounds, breachPoint, spawnPoints } = buildLevel(scene);

const playerState = {
  score: 0,
  moveSpeed: 6,
  hasGrenade: false,
  grenadeCount: 0,
};

const playerController = new PlayerController({ camera, domElement: canvas, bounds, playerState, eventBus });

const weaponConfig = createDefaultWeaponConfig();
const enemyManager = new EnemyManager({ scene, breachPoint, eventBus });
const weaponSystem = new WeaponSystem({ scene, camera, domElement: canvas, enemyManager, eventBus, weaponConfig, playerState });
const waveManager = new WaveManager({ enemyManager, spawnPoints, eventBus });
const upgradeSystem = new UpgradeSystem({ eventBus, context: { weaponConfig, playerState } });

new HUD({ eventBus, playerState });
new MenuOverlay({ eventBus, gameState, playerController });
new UpgradeOverlay({ eventBus, upgradeSystem });
new GameOverOverlay({ eventBus, playerState, waveManager });

eventBus.emit("weapon:switched", weaponSystem.getActiveInfo());

// --- State machine wiring -------------------------------------------------

playerController.controls.addEventListener("lock", () => {
  weaponSystem.enabled = true;
  if (gameState.is(States.MENU)) {
    gameState.transitionTo(States.PLAYING);
    waveManager.startWave(1);
  } else if (gameState.is(States.PAUSED)) {
    gameState.transitionTo(States.PLAYING);
  } else if (gameState.is(States.UPGRADE)) {
    gameState.transitionTo(States.PLAYING);
    waveManager.startWave(waveManager.waveNumber + 1);
  }
});

eventBus.on("player:unexpectedUnlock", () => {
  weaponSystem.enabled = false;
  if (gameState.is(States.PLAYING)) gameState.transitionTo(States.PAUSED);
});

eventBus.on("wave:cleared", () => {
  weaponSystem.enabled = false;
  playerController.unlock();
  gameState.transitionTo(States.UPGRADE);
  const choices = upgradeSystem.generateChoices(3);
  eventBus.emit("upgrade:choicesReady", choices);
});

eventBus.on("upgrade:applied", () => {
  playerController.lock();
});

eventBus.on("game:over", () => {
  weaponSystem.enabled = false;
  playerController.unlock();
  gameState.transitionTo(States.GAME_OVER);
});

eventBus.on("enemy:killed", () => {
  playerState.score += 10;
  eventBus.emit("score:changed");
});

eventBus.on("restart:requested", () => {
  weaponSystem.reset();
  enemyManager.clear();
  waveManager.reset();
  upgradeSystem.reset();
  playerState.score = 0;
  playerState.moveSpeed = 6;
  playerState.hasGrenade = false;
  playerState.grenadeCount = 0;
  playerController.reset();
  eventBus.emit("score:changed");
  eventBus.emit("weapon:switched", weaponSystem.getActiveInfo());
  gameState.transitionTo(States.MENU);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render loop -----------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (gameState.is(States.PLAYING)) {
    playerController.update(dt);
    weaponSystem.update(dt);
    enemyManager.update(dt);
    waveManager.update(dt);
  }

  renderer.render(scene, camera);
}

animate();
