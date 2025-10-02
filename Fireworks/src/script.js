import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import fireworkVertexShader from "./shaders/firework/vertex.glsl";
import fireworkFragmentShader from "./shaders/firework/fragment.glsl";
import gsap from "gsap";

/**
 * 简化的音频控制
 */
const backgroundMusic = document.getElementById("backgroundMusic");
const fireworkSound = document.getElementById("fireworkSound");
const musicToggle = document.getElementById("musicToggle");

let isMusicPlaying = false;

// 创建音频池，支持多个烟花音效同时播放
const audioPool = [];
const maxAudioInstances = 10; // 最多同时播放10个音效

// 初始化音频池
for (let i = 0; i < maxAudioInstances; i++) {
  const audio = new Audio("./firework.wav");
  audio.volume = 0.5;
  audioPool.push(audio);
}

musicToggle.addEventListener("click", () => {
  if (isMusicPlaying) {
    backgroundMusic.pause();
    musicToggle.src = "./volume-off.svg";
    isMusicPlaying = false;
  } else {
    backgroundMusic.play();
    musicToggle.src = "./volume-on.svg";
    isMusicPlaying = true;
  }
});

// 为音乐按钮添加触摸事件支持
musicToggle.addEventListener("touchend", (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  event.preventDefault(); // 阻止默认行为
  if (isMusicPlaying) {
    backgroundMusic.pause();
    musicToggle.src = "./volume-off.svg";
    isMusicPlaying = false;
  } else {
    backgroundMusic.play();
    musicToggle.src = "./volume-on.svg";
    isMusicPlaying = true;
  }
});

backgroundMusic.volume = 1.0;

// 视频控制功能
const videoToggle = document.getElementById("videoToggle");
const videoOverlay = document.getElementById("videoOverlay");
const fireworkVideo = document.getElementById("fireworkVideo");

// // 检查视频加载状态
// fireworkVideo.addEventListener("loadstart", () => console.log("视频开始加载"));
// fireworkVideo.addEventListener("loadeddata", () =>
//   console.log("视频数据加载完成")
// );
// fireworkVideo.addEventListener("error", (e) =>
//   console.error("视频加载错误:", e)
// );

// 打开视频浮窗
videoToggle.addEventListener("click", () => {
  console.log("视频按钮被点击");
  videoOverlay.classList.add("show");
  console.log("视频浮窗应该显示了");

  fireworkVideo.play().catch((error) => {
    console.error("视频播放失败:", error);
  });
});

// 为视频按钮添加触摸事件支持
videoToggle.addEventListener("touchend", (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  event.preventDefault(); // 阻止默认行为
  console.log("视频按钮被触摸");
  videoOverlay.classList.add("show");
  console.log("视频浮窗应该显示了");

  fireworkVideo.play().catch((error) => {
    console.error("视频播放失败:", error);
  });
});

// 关闭视频浮窗
const closeVideoOverlay = () => {
  videoOverlay.classList.remove("show");
  fireworkVideo.pause();
  fireworkVideo.currentTime = 0; // 重置到开始
};

// 点击浮窗背景也可以关闭
videoOverlay.addEventListener("click", (e) => {
  if (e.target === videoOverlay) {
    closeVideoOverlay();
  }
});

// 为视频浮窗添加触摸关闭支持
videoOverlay.addEventListener("touchend", (e) => {
  if (e.target === videoOverlay) {
    e.preventDefault();
    closeVideoOverlay();
  }
});

// ESC键关闭视频
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && videoOverlay.classList.contains("show")) {
    closeVideoOverlay();
  }
});

// 播放烟花爆炸音效
const playFireworkSound = () => {
  setTimeout(() => {
    if (backgroundMusic.paused) return;
    const availableAudio = audioPool.find(
      (audio) => audio.paused || audio.ended
    );
    if (availableAudio) {
      availableAudio.currentTime = 0;
      availableAudio.play().catch(() => {
        // 忽略播放失败的情况
      });
    }
  }, 2100);
};

/**
 * Base
 */
// Debug
// const gui = new GUI({ width: 340 });

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  // devicePixelRatio: physicalPixels / CSSPixels
  // use PixelRation to avoid blurriness on high-density screens
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio
);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2); // Just in case of different screen
  sizes.resolution.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );

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
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1.5, 0, 6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.enableRotate = false; // 禁用所有旋转（包括左右和上下）

// 只禁用水平旋转（左右），保留垂直旋转（上下）
controls.minAzimuthAngle = 0; // 最小水平角度
controls.maxAzimuthAngle = 0; // 最大水平角度（设置为相同值禁用水平旋转）

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Fireworks
 */

// GUI Controls for firework normal vector
const fireworkParams = {
  normalX: -0.12,
  normalY: 0.35,
  normalZ: 0.25,
  rotation: 1.15, // 新增：控制圆盘绕法线轴的旋转 (弧度)
};

// // Add GUI controls
// gui.add(fireworkParams, "normalX", -1, 1, 0.01).name("Normal X");
// gui.add(fireworkParams, "normalY", -1, 1, 0.01).name("Normal Y");
// gui.add(fireworkParams, "normalZ", -1, 1, 0.01).name("Normal Z");
// gui.add(fireworkParams, "rotation", 0, Math.PI * 2, 0.01).name("Disk Rotation"); // 新增旋转控制

const textures = [
  textureLoader.load("./particles/1.png"),
  textureLoader.load("./particles/6.png"),
  textureLoader.load("./particles/8.png"),
];

const createFirework = (count, position, size = 50, texture, radius, color) => {
  // 播放烟花爆炸音效
  playFireworkSound();

  const positionsArray = new Float32Array(count * 3);
  const sizeArray = new Float32Array(count);
  const timeMultiplierArray = new Float32Array(count);

  // Elliptical parameters
  const ellipseA = 1.2; // Semi-major axis (horizontal)
  const ellipseB = 0.6; // Semi-minor axis (vertical) - makes it elliptical

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Create elliptical firework with particles distributed along radius lines
    const rayCount = 28; // Number of radius lines
    const rayIndex = Math.floor(i / (count / rayCount)); // Which ray this particle belongs to
    const particleOnRay = (i % (count / rayCount)) / (count / rayCount); // Position along the ray (0-1)

    // Angle for this specific ray
    const angle = (rayIndex / rayCount) * Math.PI * 2;

    // Distance along the ray with non-uniform distribution (more particles on outer edge)
    // Use power function to push particles towards the outer edge
    const normalizedPosition = particleOnRay; // 0 to 1
    const skewedPosition = Math.pow(normalizedPosition, 0.5); // Square root makes more particles go outward
    const distance = (skewedPosition * 0.8 + 0.3) * radius; // Distribute particles from 30% to 110% of radius

    // Calculate local elliptical position (in ellipse's local coordinate system)
    const localX = Math.cos(angle) * distance * ellipseA;
    const localY = Math.sin(angle) * distance * ellipseB;
    const localZ = (Math.random() - 0.5) * 0.02; // Small random Z variation

    // Define ellipse orientation (normal vector and rotation)
    const normal = new THREE.Vector3(
      fireworkParams.normalX,
      fireworkParams.normalY,
      fireworkParams.normalZ
    ).normalize(); // Ellipse normal vector (controlled by GUI!)
    const up = new THREE.Vector3(0, 1, 0); // Reference up vector

    // Create rotation matrix to orient the ellipse
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    const newUp = new THREE.Vector3().crossVectors(normal, right).normalize();

    // Apply additional rotation around the normal axis (disk rotation)
    const cosRot = Math.cos(fireworkParams.rotation);
    const sinRot = Math.sin(fireworkParams.rotation);

    // Rotate the right and newUp vectors around the normal
    const rotatedRight = new THREE.Vector3(
      right.x * cosRot + newUp.x * sinRot,
      right.y * cosRot + newUp.y * sinRot,
      right.z * cosRot + newUp.z * sinRot
    );

    const rotatedUp = new THREE.Vector3(
      -right.x * sinRot + newUp.x * cosRot,
      -right.y * sinRot + newUp.y * cosRot,
      -right.z * sinRot + newUp.z * cosRot
    );

    // Transform local coordinates to world coordinates using rotated axes
    const worldPosition = new THREE.Vector3(
      localX * rotatedRight.x + localY * rotatedUp.x + localZ * normal.x,
      localX * rotatedRight.y + localY * rotatedUp.y + localZ * normal.y,
      localX * rotatedRight.z + localY * rotatedUp.z + localZ * normal.z
    );

    positionsArray[i3 + 0] = worldPosition.x;
    positionsArray[i3 + 1] =
      worldPosition.y - Math.pow(worldPosition.length() * 0.4, 3); // Y减去到中心的距离
    positionsArray[i3 + 2] = worldPosition.z;

    sizeArray[i] = Math.random();
    timeMultiplierArray[i] = 1.0 + Math.random();
  }

  // BufferGeometry sends data (like vertices) to the GPU
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positionsArray, 3)
  );
  geometry.setAttribute(
    "aSize",
    new THREE.Float32BufferAttribute(sizeArray, 1)
  );
  geometry.setAttribute(
    "aTimeMultiplier",
    new THREE.Float32BufferAttribute(timeMultiplierArray, 1)
  );

  // Material
  texture.flipY = false;
  const material = new THREE.ShaderMaterial({
    vertexShader: fireworkVertexShader,
    fragmentShader: fireworkFragmentShader,
    uniforms: {
      uSize: new THREE.Uniform(size),
      uResolution: new THREE.Uniform(sizes.resolution),
      uTexture: new THREE.Uniform(texture),
      uColor: new THREE.Uniform(color),
      uProgress: new THREE.Uniform(0),
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // Points
  const fireworks = new THREE.Points(geometry, material);
  fireworks.position.copy(position);
  scene.add(fireworks);

  //   Destory
  const destory = () => {
    scene.remove(fireworks);
    geometry.dispose();
    material.dispose();
  };

  //   Animate
  gsap.to(material.uniforms.uProgress, {
    value: 1,
    duration: 8, // 延长动画时间，为目标位置移动留出时间
    ease: "linear",
    onComplete: destory,
  });
};

const createRandomFirework = () => {
  const count = 2500 + Math.floor(Math.random() * 200);
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    Math.random() - 0.3,
    (Math.random() - 0.5) * 4
  );
  createFirework(
    count,
    position,
    0.08, // Size
    textures[0],
    1,
    new THREE.Color(`hsl(${Math.random() * 360}, 100%, 75%)`)
  );
};

window.addEventListener("click", (event) => {
  // 检查点击是否在按钮区域
  if (
    event.target.closest(".audio-btn") ||
    event.target.closest(".video-btn") ||
    event.target.closest(".video-overlay")
  ) {
    return; // 如果点击的是按钮，不触发烟花
  }
  createRandomFirework();
});

// 专门为微信浏览器添加触摸事件
document.addEventListener(
  "touchend",
  (event) => {
    // 检查触摸是否在按钮区域
    if (
      event.target.closest(".audio-btn") ||
      event.target.closest(".video-btn") ||
      event.target.closest(".video-overlay")
    ) {
      return; // 如果触摸的是按钮，不阻止默认行为，让按钮正常工作
    }
    // 阻止默认的点击事件，避免双重触发
    event.preventDefault();
    createRandomFirework();
  },
  { passive: false }
);

// 额外的触摸开始事件，某些情况下微信只响应这个
document.addEventListener(
  "touchstart",
  (event) => {
    // 检查触摸是否在按钮区域
    if (
      event.target.closest(".audio-btn") ||
      event.target.closest(".video-btn") ||
      event.target.closest(".video-overlay")
    ) {
      return; // 如果触摸的是按钮，不阻止默认行为
    }
    event.preventDefault();
  },
  { passive: false }
);

/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
