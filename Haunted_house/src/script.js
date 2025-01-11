import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Timer } from "three/addons/misc/Timer.js";
import GUI from "lil-gui";
import { Sky } from "three/addons/objects/Sky.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Textures
const textureLoader = new THREE.TextureLoader();
// door
const doorColorTexture = textureLoader.load(
  "./door_m/medieval_wood_diff_1k.jpg"
);
doorColorTexture.colorSpace = THREE.SRGBColorSpace;
const doorNormalTexture = textureLoader.load(
  "./door_m/medieval_wood_nor_gl_1k.png"
);
const doorARMTexture = textureLoader.load("./door_m/medieval_wood_arm_1k.png");
// Grave
const graveColorTexture = textureLoader.load(
  "./stone/plastered_stone_wall_diff_1k.jpg"
);
graveColorTexture.colorSpace = THREE.SRGBColorSpace;
const graveNormalTexture = textureLoader.load(
  "./stone/plastered_stone_wall_nor_gl_1k.png"
);
const graveARMTexture = textureLoader.load(
  "./stone/plastered_stone_wall_arm_1k.png"
);
// bush
const bushColorTexture = textureLoader.load("./grass/sparse_grass_diff_1k.jpg");
bushColorTexture.colorSpace = THREE.SRGBColorSpace;
const bushARMTexture = textureLoader.load("./grass/sparse_grass_arm_1k.png");
const bushNormalTexture = textureLoader.load(
  "./grass/sparse_grass_nor_gl_1k.png"
);
// Roof
const roofColorTexture = textureLoader.load(
  "./roof/roof_tiles/roof_tiles_14_diff_1k.jpg"
);
roofColorTexture.colorSpace = THREE.SRGBColorSpace;
roofColorTexture.repeat.set(4, 1);
roofColorTexture.wrapS = THREE.RepeatWrapping;

const roofNormalTexture = textureLoader.load(
  "./roof/roof_tiles/roof_tiles_14_nor_gl_1k.png"
);
roofNormalTexture.repeat.set(4, 1);
roofNormalTexture.wrapS = THREE.RepeatWrapping;

const roofARMTexture = textureLoader.load(
  "./roof/roof_tiles/roof_tiles_14_arm_1k.png"
);
roofARMTexture.repeat.set(4, 1);
roofARMTexture.wrapS = THREE.RepeatWrapping;

// wall
const wallColorTexture = textureLoader.load(
  "./wall/wook_planks_grey/wood_planks_grey_diff_1k.jpg"
);
wallColorTexture.repeat.set(2, 2);
wallColorTexture.wrapS = THREE.RepeatWrapping;
wallColorTexture.wrapT = THREE.RepeatWrapping;
wallColorTexture.colorSpace = THREE.SRGBColorSpace;
const wallNormalTexture = textureLoader.load(
  "./wall/wook_planks_grey/wood_planks_grey_nor_gl_1k.png"
);
wallNormalTexture.repeat.set(2, 2);
wallNormalTexture.wrapS = THREE.RepeatWrapping;
wallNormalTexture.wrapT = THREE.RepeatWrapping;
const wallARMTexture = textureLoader.load(
  "./wall/wook_planks_grey/wood_planks_grey_arm_1k.png"
);
wallARMTexture.repeat.set(2, 2);
wallARMTexture.wrapS = THREE.RepeatWrapping;
wallARMTexture.wrapT = THREE.RepeatWrapping;
// Floor
const floorAlphaTexture = textureLoader.load("./floor/alpha.jpg");
const floorColorTexture = textureLoader.load(
  "./floor/dirt_1k/dirt_diff_1k.jpg"
);
floorColorTexture.repeat.set(8, 8);
floorColorTexture.wrapS = THREE.RepeatWrapping;
floorColorTexture.wrapT = THREE.RepeatWrapping;
floorColorTexture.colorSpace = THREE.SRGBColorSpace;
const floorARMTexture = textureLoader.load("./floor/dirt_1k/dirt_arm_1k.png");
floorARMTexture.repeat.set(8, 8);
floorARMTexture.wrapS = THREE.RepeatWrapping;
floorARMTexture.wrapT = THREE.RepeatWrapping;
const floorNormalTexture = textureLoader.load(
  "./floor/dirt_1k/dirt_nor_gl_1k.png"
);
floorNormalTexture.repeat.set(8, 8);
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;
const floorDisplacementTexture = textureLoader.load(
  "./floor/dirt_1k/dirt_disp_1k.png"
);
floorDisplacementTexture.repeat.set(8, 8);
floorDisplacementTexture.wrapS = THREE.RepeatWrapping;
floorDisplacementTexture.wrapT = THREE.RepeatWrapping;
/**
 * House
 */

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20, 80, 80),
  new THREE.MeshStandardMaterial({
    alphaMap: floorAlphaTexture,
    map: floorColorTexture,
    aoMap: floorARMTexture,
    roughnessMap: floorARMTexture,
    metalnessMap: floorARMTexture,
    normalMap: floorNormalTexture,
    displacementMap: floorDisplacementTexture,
    displacementScale: 0.3,
    displacementBias: -0.18,
    transparent: true,
  })
);
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

gui
  .add(floor.material, "displacementScale")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Displacement Scale");
gui.add(floor.material, "displacementBias").min(-1).max(1).step(0.001);

// House Container
const house = new THREE.Group();
// walls
const wallgeometry = new THREE.BoxGeometry(4, 2.5, 4);
const walls = new THREE.Mesh(
  wallgeometry,
  new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    normalMap: wallNormalTexture,
    aoMap: wallARMTexture,
    roughnessMap: wallARMTexture,
    metalnessMap: wallARMTexture,
  })
);

walls.position.y += 2.5 / 2;
house.add(walls);
// roof
const roof = new THREE.Mesh(
  new THREE.ConeGeometry(3.5, 1.5, 4),
  new THREE.MeshStandardMaterial({
    map: roofColorTexture,
    normalMap: roofNormalTexture,
    aoMap: roofARMTexture,
    roughnessMap: roofARMTexture,
    metalnessMap: roofARMTexture,
  })
);
roof.rotation.y = Math.PI * 0.25;
roof.position.y += 2.5 + 1.5 / 2;
house.add(roof);
// door
const door = new THREE.Mesh(
  new THREE.PlaneGeometry(1.8, 2.2),
  new THREE.MeshStandardMaterial({
    map: doorColorTexture,
    normalMap: doorNormalTexture,
    aoMap: doorARMTexture,
    roughnessMap: doorARMTexture,
    metalnessMap: doorARMTexture,
    // displacementBias: -0.1,
  })
);
door.position.z += 2 + 0.01;
door.position.y += 1;
house.add(door);

// bushes
const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({
  map: bushColorTexture,
  normalMap: bushNormalTexture,
  aoMap: bushARMTexture,
  roughnessMap: bushARMTexture,
  metalnessMap: bushARMTexture,
});

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
bush1.scale.set(0.5, 0.5, 0.5);
bush1.position.set(0.8, 0.2, 2.2);

const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
bush2.scale.set(0.25, 0.25, 0.25);
bush2.position.set(1.4, 0.1, 2.1);

const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
bush3.scale.set(0.4, 0.4, 0.4);
bush3.position.set(-0.8, 0.1, 2.2);

const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
bush4.scale.set(0.15, 0.15, 0.15);
bush4.position.set(-1, 0.05, 2.6);
house.add(bush1, bush2, bush3, bush4);
scene.add(house);

// Graves
const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
const graveMaterial = new THREE.MeshStandardMaterial({
  map: graveColorTexture,
  aoMap: graveARMTexture,
  roughnessMap: graveARMTexture,
  metalnessMap: graveARMTexture,
  normalMap: graveNormalTexture,
});

const graves = new THREE.Group();
scene.add(graves);
for (let i = 0; i < 30; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 3 + Math.random() * 4;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  const grave = new THREE.Mesh(graveGeometry, graveMaterial);
  grave.position.set(x, Math.random() * 0.4, z);
  grave.rotation.x = (Math.random() - 0.5) * 0.4;
  grave.rotation.y = (Math.random() - 0.5) * 0.4;
  grave.rotation.z = (Math.random() - 0.5) * 0.4;
  graves.add(grave);
}
/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight("#86cdff", 0.275);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight("#86cdff", 1);
directionalLight.position.set(3, 2, -8);
scene.add(directionalLight);

// door light
const doorLight = new THREE.PointLight("#ff7d46", 5);
doorLight.position.set(0, 2.2, 2.7);
house.add(doorLight);

// ghost light
const ghost1 = new THREE.PointLight("#f8f9fa", 4);
scene.add(ghost1);

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
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// cast and receive shadows
directionalLight.castShadow = true;
ghost1.castShadow = true;

walls.castShadow = true;
walls.receiveShadow = true;
roof.castShadow = true;
roof.receiveShadow = true;
floor.receiveShadow = true;
graves.children.forEach((grave) => {
  grave.castShadow = true;
  grave.receiveShadow = true;
});
// mappping
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;
directionalLight.shadow.camera.far = 20;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.camera.near = 1;

// sky
const sky = new Sky();
sky.scale.setScalar(100, 100, 100);
scene.add(sky);
sky.material.uniforms["turbidity"].value = 10;
sky.material.uniforms["rayleigh"].value = 3;
sky.material.uniforms["mieCoefficient"].value = 0.1;
sky.material.uniforms["mieDirectionalG"].value = 0.95;
sky.material.uniforms["sunPosition"].value.set(0.3, -0.038, -0.95);

// fog
scene.fog = new THREE.Fog("#04343f", 0.1, 15);

/**
 * Animate
 */
const timer = new Timer();

const tick = () => {
  // Timer
  timer.update();
  const elapsedTime = timer.getElapsed();

  // Update ghost
  const ghost1Angle = elapsedTime * 0.5;
  ghost1.position.x = Math.cos(ghost1Angle) * 4;
  ghost1.position.z = Math.sin(ghost1Angle) * 4;
  ghost1.position.y =
    Math.sin(ghost1Angle) *
      Math.sin(ghost1Angle * 2.34) *
      Math.sin(ghost1Angle * 3.45) +
    1;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
