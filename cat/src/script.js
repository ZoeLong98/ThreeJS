import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

/**
 * Base
 */
// Debug
const gui = new GUI();
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap

      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMap/px.jpg",
  "/textures/environmentMap/nx.jpg",
  "/textures/environmentMap/py.jpg",
  "/textures/environmentMap/ny.jpg",
  "/textures/environmentMap/pz.jpg",
  "/textures/environmentMap/nz.jpg",
]);

environmentMap.colorSpace = THREE.SRGBColorSpace;

// scene.background = environmentMap
scene.environment = environmentMap;

// Set scene background to white (overrides environment as visible background)
scene.background = new THREE.Color("#ffffff");

/**
 * Models
 */
let foxMixer = null;
let eye = null;
let ear = null;
let tail = null;
let eyeFollow = null;

gltfLoader.load("/models/Cat.glb", (gltf) => {
  // Model
  scene.add(gltf.scene);
  console.log(gltf.scene);

  // Find mesh named 'eye_black' in the loaded GLTF and assign it to `eye`
  eye = gltf.scene.getObjectByName("eye_black");
  if (!eye) {
    // fallback: traverse and try to match name (case-insensitive contains)
    gltf.scene.traverse((child) => {
      if (
        child.isMesh &&
        child.name &&
        child.name.toLowerCase().includes("eye_black")
      ) {
        eye = child;
      }
    });
  }

  if (eye) {
    // Initialize small follow behavior (max offset 0.03)
    eyeFollow = setupEyeFollow(eye, 0.03);
    console.log("Found eye_black mesh:", eye);
  } else {
    console.warn("eye_black mesh not found in GLTF scene");
  }
  // Animation

  // Update materials
  updateAllMaterials();
});

/**
 * Floor
 */
const floorColorTexture = textureLoader.load("textures/dirt/color.jpg");
floorColorTexture.colorSpace = THREE.SRGBColorSpace;
floorColorTexture.repeat.set(1.5, 1.5);
floorColorTexture.wrapS = THREE.RepeatWrapping;
floorColorTexture.wrapT = THREE.RepeatWrapping;

const floorNormalTexture = textureLoader.load("textures/dirt/normal.jpg");
floorNormalTexture.repeat.set(1.5, 1.5);
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;

const floorGeometry = new THREE.CircleGeometry(5, 64);
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorColorTexture,
  normalMap: floorNormalTexture,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
// scene.add(floor);

/**
 * Eye follow helper
 * setupEyeFollow(eyeMesh, maxDistance) -> { update(), dispose() }
 * - maxDistance: maximum position offset in world units (e.g. 0.03)
 * Behavior: listens to mousemove, maps screen position to a small target offset
 * and provides an update() function for the render loop to smoothly lerp the eye.
 */
const setupEyeFollow = (eyeMesh, maxDistance = 0.1) => {
  if (!eyeMesh) return null;

  const originalPos = eyeMesh.position.clone();
  const targetOffset = new THREE.Vector3();
  const currentOffset = new THREE.Vector3();

  const updateTargetOffset = (clientX, clientY) => {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    targetOffset.set(-x * maxDistance, y * maxDistance, 0);
  };

  const onMouseMove = (event) => {
    updateTargetOffset(event.clientX, event.clientY);
  };

  const onTouchMove = (event) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      updateTargetOffset(touch.clientX, touch.clientY);
    }
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onTouchMove, { passive: true });

  return {
    update: (lerpFactor = 0.15) => {
      // Smoothly interpolate currentOffset toward targetOffset
      currentOffset.lerp(targetOffset, lerpFactor);
      // Apply offset relative to original position
      eyeMesh.position.copy(originalPos).add(currentOffset);
    },
    dispose: () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    },
  };
};

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 4);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(3.5, 2, -1.25);
scene.add(directionalLight);

gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(-4, 4, -8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enabled = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.75;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor("#ffffff");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();

  // Update eye follow if initialized
  if (eyeFollow && typeof eyeFollow.update === "function") {
    // Use a lerp factor scaled by deltaTime for consistent smoothing
    const lerpFactor = Math.min(1, Math.max(0.01, deltaTime * 10));
    eyeFollow.update(lerpFactor);
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
