import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// Loading Manager
const loadingManager = new THREE.LoadingManager();

// Loading UI elements
const loadingScreen = document.getElementById("loading-screen");
const loadingBar = document.getElementById("loading-bar");
const loadingPercentage = document.getElementById("loading-percentage");

loadingManager.onProgress = (url, loaded, total) => {
  const progress = (loaded / total) * 100;
  loadingBar.style.width = `${progress}%`;
  loadingPercentage.textContent = `${Math.round(progress)}%`;
};

loadingManager.onLoad = () => {
  console.log("All models loaded!");
  // 延迟隐藏loading屏幕，让用户看到100%
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 500);
};

loadingManager.onError = (url) => {
  console.error("Error loading:", url);
};

// Loaders with LoadingManager
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

async function loadModels(models) {
  // 这里的并发加载使得模型的顺序会错乱，需要后续处理
  const loadPromises = models.map(
    (model, modelIndex) =>
      new Promise((resolve) => {
        gltfLoader.load(model, (gltf) => {
          console.log(`Loading model ${modelIndex}: ${model}`, gltf);

          if (gltf.scene.children[0].children.length > 1) {
            const mergedPositions = [];
            // 为合并的几何体计算bounding box
            const tempGeometry = new THREE.BufferGeometry();
            gltf.scene.children[0].children.forEach((child) => {
              mergedPositions.push(...child.geometry.attributes.position.array);
            });
            const mergedAttribute = new THREE.Float32BufferAttribute(
              mergedPositions,
              3
            );
            // 为合并的几何体设置position并计算bounding box
            tempGeometry.setAttribute("position", mergedAttribute);
            tempGeometry.computeBoundingBox();

            // 返回包含索引的对象，确保顺序正确
            resolve({
              modelIndex: modelIndex,
              modelName: model,
              boundingBox: tempGeometry.boundingBox,
              positionAttribute: mergedAttribute,
            });
          } else {
            const geometry = gltf.scene.children[0].geometry;

            // 返回包含索引的对象，确保顺序正确
            resolve({
              modelIndex: modelIndex,
              modelName: model,
              boundingBox: geometry.boundingBox,
              positionAttribute: geometry.attributes.position,
            });
          }
        });
      })
  );

  const loadedModels = await Promise.all(loadPromises);

  // 按照原始索引排序，确保顺序正确
  loadedModels.sort((a, b) => a.modelIndex - b.modelIndex);

  // 分别提取bounding box和position attributes
  const boundingBox = loadedModels.map((model) => model.boundingBox);
  const positions = loadedModels.map((model) => model.positionAttribute);

  return { positions, boundingBox };
}

export { loadModels };
