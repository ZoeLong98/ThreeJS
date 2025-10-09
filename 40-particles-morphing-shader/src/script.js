import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import { initScrollControl } from "./scrollControl.js";
import { loadModels } from "./loadModels.js";

const notebookIcon = document.querySelector("#notebook-icon");
const projectSummary = document.querySelector("#project-summary");
notebookIcon.addEventListener("click", () => {
  projectSummary.classList.toggle("visible");
});
/**
 * Base
 */
const models = ["./hello.glb", "./someone.glb", "./cute.glb", "./meet.glb"];
// Debug
// const gui = new GUI({ width: 340 });
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

/**
 * Scroll Control
 */
const scrollControl = {
  value: 0,
  targetValue: 0,
  sensitivity: 0.001,
  smoothness: 0.1,
  min: -0.2,
  max: 1.2,
  range: 1.4,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Materials
  if (particles.material) {
    particles.material.uniforms.uResolution.value.set(
      sizes.width * sizes.pixelRatio,
      sizes.height * sizes.pixelRatio
    );
  }

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 16);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enabled = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = "#174d74";
// gui.addColor(debugObject, "clearColor").onChange(() => {
//   renderer.setClearColor(debugObject.clearColor);
// });
renderer.setClearColor(debugObject.clearColor);

/**
 * Particles
 */
const particles = {};
particles.index = 0;
particles.normals = [
  [-1, 0, 0],
  [0, 0, -1],
  [1, 0, 0],
  [0, 0, 1],
];
particles.colorA = "#fdf5a0";
particles.colorB = "#29a6ff";

const { positions, boundingBox } = await loadModels(models);
particles.boundingBox = boundingBox;

particles.maxCount = 0;
for (const position of positions) {
  if (position.count > particles.maxCount) particles.maxCount = position.count;
}

// 计算每个模型的相机位置信息
particles.cameraInfo = [];
for (let i = 0; i < particles.boundingBox.length; i++) {
  const box = particles.boundingBox[i];
  const modelName = models[i].split("/").pop().split(".")[0];

  if (box) {
    // 获取bounding box的中心和尺寸
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // 找到最长的边
    const maxDimension = Math.max(size.x, size.y, size.z);

    // 计算相机距离，确保最长边能完全显示在屏幕中央
    const fov = camera.fov * (Math.PI / 180); // 转换为弧度
    const distance = (maxDimension / (2 * Math.tan(fov / 2))) * 1.2; // 1.2为安全边距

    particles.cameraInfo.push({
      center: center,
      size: size,
      maxDimension: maxDimension,
      optimalDistance: Math.max(distance, 2), // 最小距离为2
      modelName: modelName,
    });
  } else {
    console.warn(`Model ${i} (${modelName}) has no bounding box!`);
  }
}

// 相机聚焦功能
particles.focusOnModel = (index, duration = 2) => {
  if (index < 0 || index >= particles.cameraInfo.length) return;

  const info = particles.cameraInfo[index];

  // 计算相机位置 - 在模型前方
  const direction = new THREE.Vector3(
    particles.normals[index][0],
    particles.normals[index][1],
    particles.normals[index][2]
  );
  const targetPosition = info.center
    .clone()
    .add(direction.multiplyScalar(info.optimalDistance));

  // 动画移动相机
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: duration,
    ease: "power2.inOut",
  });

  // 动画移动控制器目标（相机看向的点）
  gsap.to(controls.target, {
    x: info.center.x,
    y: info.center.y,
    z: info.center.z,
    duration: duration,
    ease: "power2.inOut",
  });
};

particles.positions = [];
for (const position of positions) {
  const originalArray = position.array;
  const newArray = new Float32Array(particles.maxCount * 3);
  for (let i = 0; i < particles.maxCount; i++) {
    const i3 = i * 3;

    if (i3 < originalArray.length) {
      newArray[i3 + 0] = originalArray[i3 + 0];
      newArray[i3 + 1] = originalArray[i3 + 1];
      newArray[i3 + 2] = originalArray[i3 + 2];
    } else {
      const randomIndex = Math.floor(position.count * Math.random()) * 3;
      newArray[i3 + 0] = originalArray[randomIndex + 0];
      newArray[i3 + 1] = originalArray[randomIndex + 1];
      newArray[i3 + 2] = originalArray[randomIndex + 2];
    }
  }
  //   tell the GPU to take this array three by three
  particles.positions.push(new THREE.Float32BufferAttribute(newArray, 3));
}

// Geometry
const sizesArray = new Float32Array(particles.maxCount);
for (let i = 0; i < particles.maxCount; i++)
  sizesArray[i] = Math.random() * 1.5;
particles.geometry = new THREE.BufferGeometry();
particles.geometry.setAttribute(
  "position",
  particles.positions[particles.index] // 默认显示第一个模型
);
particles.geometry.setAttribute(
  "aTargetPosition",
  particles.positions[Math.min(particles.index + 1, models.length - 1)]
);
particles.geometry.setAttribute(
  "aSize",
  new THREE.BufferAttribute(sizesArray, 1)
);

particles.geometry.setIndex(null); // 非索引缓冲几何体

particles.material = new THREE.ShaderMaterial({
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  uniforms: {
    uSize: new THREE.Uniform(0.05),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      )
    ),
    uProgress: new THREE.Uniform(0.0),
    uColorA: new THREE.Uniform(new THREE.Color(particles.colorA)),
    uColorB: new THREE.Uniform(new THREE.Color(particles.colorB)),
  },
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Points
particles.points = new THREE.Points(particles.geometry, particles.material);
particles.points.frustumCulled = false;
scene.add(particles.points);

// // Tweaks
// gui
//   .add(particles.material.uniforms.uProgress, "value")
//   .min(0)
//   .max(1)
//   .step(0.01)
//   .name("progress")
//   .listen();

// gui.addColor(particles, "colorA").onChange(() => {
//   particles.material.uniforms.uColorA.value.set(particles.colorA);
// });
// gui.addColor(particles, "colorB").onChange(() => {
//   particles.material.uniforms.uColorB.value.set(particles.colorB);
// });
// gui.add(particles.material.uniforms.uSize, "value").min(0).max(0.3).step(0.01);

// 初始化滚动控制
const { updateScrollValue } = initScrollControl({
  scrollControl,
  particles,
  camera,
  controls,
  models,
});
/**
 * Animate
 */
const tick = () => {
  // Update scroll value
  updateScrollValue();

  // Update controls
  controls.update();

  // Render normal scene
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
