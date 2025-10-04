import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import { gsap } from "gsap";

const gap = 20; // 图片间距
const farthestZ = gap * 5; // 最远的Z位置

const notebookIcon = document.querySelector("#notebook-icon");
const projectSummary = document.querySelector("#project-summary");

notebookIcon.addEventListener("click", () => {
  projectSummary.classList.toggle("visible");
});
/**
 * Base
 */
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
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update all particles materials
  particlesMaterials.forEach((material) => {
    material.uniforms.uResolution.value.set(
      sizes.width * sizes.pixelRatio,
      sizes.height * sizes.pixelRatio
    );
  });

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
  30,
  sizes.width / sizes.height,
  0.1,
  farthestZ
);
camera.position.set(0, 0, 30);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// 禁用 OrbitControls 的所有交互
controls.enabled = false;

/**
 * Custom Camera Controls - 自定义相机控制
 */
const cameraControls = {
  moveSpeed: 1.0, // 移动速度
  dampingFactor: 0.07, // 阻尼系数，值越小越平滑
  targetZ: camera.position.z, // 目标Z位置
  minZ: 30, // 最小Z位置
  maxZ: farthestZ,

  // 更新相机位置
  update: function () {
    // 使用线性插值实现平滑移动
    camera.position.z +=
      (this.targetZ - camera.position.z) * this.dampingFactor;
  },

  // 移动相机
  moveCamera: function (delta) {
    this.targetZ += delta * this.moveSpeed;
    // 限制移动范围
    this.targetZ = Math.max(this.minZ, Math.min(this.maxZ, this.targetZ));
  },
};

// 鼠标滚轮控制
window.addEventListener("wheel", (event) => {
  event.preventDefault();
  // 标准化滚轮值，不同浏览器和设备的滚轮值可能不同
  const delta = Math.sign(event.deltaY) * 0.2;
  cameraControls.moveCamera(delta);
});

// 键盘控制
window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      cameraControls.moveCamera(-1.5);
      event.preventDefault();
      break;
    case "ArrowDown":
    case "KeyS":
      cameraControls.moveCamera(1.5);
      event.preventDefault();
      break;
  }
});

// 触摸屏控制
let touchStartY = null;
let touchMoveSpeed = 0.1; // 触摸移动速度系数

window.addEventListener("touchstart", (event) => {
  if (event.touches.length === 1) {
    touchStartY = event.touches[0].clientY;
  }
});

window.addEventListener("touchmove", (event) => {
  if (event.touches.length === 1 && touchStartY !== null) {
    event.preventDefault();
    const touchY = event.touches[0].clientY;
    const deltaY = (-touchY + touchStartY) * touchMoveSpeed;
    cameraControls.moveCamera(deltaY);
    touchStartY = touchY;
  }
});

window.addEventListener("touchend", () => {
  touchStartY = null;
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor("#ffffff");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Displacement
 */
const displacement = {};

// 2D canvas
displacement.canvas = document.createElement("canvas");
displacement.canvas.width = 128;
displacement.canvas.height = 128;
displacement.canvas.style.position = "fixed";
// displacement.canvas.style.width = "512px";
// displacement.canvas.style.height = "512px";
displacement.canvas.style.top = 0;
displacement.canvas.style.left = 0;
displacement.canvas.style.zIndex = 10;
// document.body.append(displacement.canvas);

// Context
// getContext("2d")表示获取一个2D渲染上下文，这个对象里包含了所有绘图API
displacement.context = displacement.canvas.getContext("2d");
displacement.context.fillRect(
  0,
  0,
  displacement.canvas.width,
  displacement.canvas.height
);

// Glow image
displacement.glowImage = new Image();
displacement.glowImage.src = "./glow.png";
displacement.interactivePlane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 1, 1),
  new THREE.MeshBasicMaterial({
    color: "red",
    side: THREE.DoubleSide,
    visible: false,
  })
);
scene.add(displacement.interactivePlane); // 启用交互平面

// Raycaster
displacement.raycaster = new THREE.Raycaster();

// Coordinates
displacement.screenCursor = new THREE.Vector2(9999, 9999);
displacement.canvasCursor = new THREE.Vector2(9999, 9999);
displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999);

// pointermove works for mouse and touch
window.addEventListener("pointermove", (event) => {
  displacement.screenCursor.x = (event.clientX / sizes.width) * 2 - 1;
  displacement.screenCursor.y = -(event.clientY / sizes.height) * 2 + 1;
});

displacement.texture = new THREE.CanvasTexture(displacement.canvas);

const particles = [];
const meshBackground = [];
const particlesMaterials = []; // 添加材质数组

// 添加动画相关变量
let currentIndex = 0;
let isAnimating = false;

const pictures = [
  {
    texture: textureLoader.load("./picture-1.png"),
    position: new THREE.Vector3(0, 0, 0),
  },
  {
    texture: textureLoader.load("./picture-2.png"),
    position: new THREE.Vector3(0, -15, gap),
  },
  {
    texture: textureLoader.load("./picture-3.png"),
    position: new THREE.Vector3(0, -15, 2 * gap),
  },
  {
    texture: textureLoader.load("./picture-4.png"),
    position: new THREE.Vector3(0, -15, 3 * gap),
  },
];

for (let i = 0; i < pictures.length; i++) {
  // Background
  const planeBackground = new THREE.PlaneGeometry(18, 14, 1, 1);
  const materialBackground = new THREE.MeshBasicMaterial({
    color: "#000000",
    side: THREE.DoubleSide, // 确保双面可见
  });
  meshBackground.push(new THREE.Mesh(planeBackground, materialBackground));
  meshBackground[i].position.y = pictures[i].position.y;
  meshBackground[i].position.z = pictures[i].position.z - 0.1; // 放在粒子后面
  scene.add(meshBackground[i]);

  /**
   * Particles
   */
  const particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
  particlesGeometry.setIndex(null);
  particlesGeometry.deleteAttribute("normal");

  const intensitiesArray = new Float32Array(
    particlesGeometry.attributes.position.count
  );
  const anglesArray = new Float32Array(
    particlesGeometry.attributes.position.count
  );
  for (let i = 0; i < particlesGeometry.attributes.position.count; i++) {
    intensitiesArray[i] = Math.random();
    anglesArray[i] = Math.random() * Math.PI * 2;
  }

  // Three.BufferAttribute是一个类，用来存储顶点相关的数据
  // WebGL要求数据以缓冲区的形式传给GPU
  particlesGeometry.setAttribute(
    "aIntensity",
    new THREE.BufferAttribute(intensitiesArray, 1)
  );
  particlesGeometry.setAttribute(
    "aAngle",
    new THREE.BufferAttribute(anglesArray, 1)
  );

  const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uResolution: new THREE.Uniform(
        new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        )
      ),
      uPictureTexture: new THREE.Uniform(pictures[i].texture),
      uDisplacementTexture: new THREE.Uniform(displacement.texture),
    },
  });

  // 将材质添加到数组中
  particlesMaterials.push(particlesMaterial);

  // THREE.Points 渲染成点，只显示顶点，常用来做粒子系统
  particles.push(new THREE.Points(particlesGeometry, particlesMaterial));
  particles[i].position.copy(pictures[i].position); // 设置粒子系统的位置
  scene.add(particles[i]);
}

/**
 * Animate
 */
const tick = () => {
  // Update custom camera controls
  cameraControls.update();

  // Smooth position change with GSAP
  const targetIndex = Math.floor((camera.position.z - 30) / gap);

  // 只有当索引改变且没有正在进行动画时才执行
  if (
    targetIndex !== currentIndex &&
    !isAnimating &&
    targetIndex >= 0 &&
    targetIndex < pictures.length
  ) {
    isAnimating = true;

    // 更新交互平面位置
    displacement.interactivePlane.position.z = pictures[targetIndex].position.z;

    // 动画时间线
    const tl = gsap.timeline({
      onComplete: () => {
        currentIndex = targetIndex;
        isAnimating = false;
      },
    });

    // 同时动画背景和粒子
    meshBackground.forEach((mesh, meshIndex) => {
      const targetY = meshIndex === targetIndex ? 0 : -gap;
      tl.to(
        mesh.position,
        {
          y: targetY,
          duration: 0.8,
          ease: "power2.inOut",
        },
        0
      ); // 0 表示同时开始
    });

    particles.forEach((particle, particleIndex) => {
      const targetY = particleIndex === targetIndex ? 0 : -gap;
      tl.to(
        particle.position,
        {
          y: targetY,
          duration: 0.8,
          ease: "power2.inOut",
        },
        0
      ); // 0 表示同时开始
    });
  }

  /**
   * Raycaster
   */
  //   setFromCamera做了像素坐标到构建射线的一整套逆投影流程
  displacement.raycaster.setFromCamera(displacement.screenCursor, camera);
  const intersections = displacement.raycaster.intersectObject(
    displacement.interactivePlane //需要检测碰撞的对象
  ); // intersections返回交点对象，对象会按照从近到远排序

  if (intersections.length) {
    const uv = intersections[0].uv;
    displacement.canvasCursor.x = uv.x * displacement.canvas.width;
    displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
  }

  /**
   * Displacement canvas
   */
  // globalAlpha透明度，globalCompositeOperation设置如何把新绘制的内容和画布上已有的内容混合
  displacement.context.globalCompositeOperation = "source-over";
  displacement.context.globalAlpha = 0.02;
  displacement.context.fillRect(
    0,
    0,
    displacement.canvas.width,
    displacement.canvas.height
  );

  // Speed alpha
  const cursorDistance = displacement.canvasCursorPrevious.distanceTo(
    displacement.canvasCursor
  );
  displacement.canvasCursorPrevious.copy(displacement.canvasCursor);
  const alpha = Math.min(Math.max(cursorDistance * 0.1, 0), 1);

  // Draw glow
  const glowSize = displacement.canvas.width * 0.25;
  displacement.context.globalCompositeOperation = "lighten";
  displacement.context.globalAlpha = alpha;
  displacement.context.drawImage(
    displacement.glowImage,
    displacement.canvasCursor.x - glowSize / 2,
    displacement.canvasCursor.y - glowSize / 2,
    glowSize,
    glowSize
  );

  // Texture
  displacement.texture.needsUpdate = true;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
