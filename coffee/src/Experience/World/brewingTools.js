import * as THREE from "three";
import Experience from "../Experience";

export default class BrewingTools {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.debug = this.experience.debug;
    this.resources = this.experience.resources;

    this.mokaModel = this.resources.items.brewingTools_Moka;

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("brewing tools");
    }

    this.setModel();
    this.setRaycastClick();
  }

  setModel() {
    this.moka = this.mokaModel.scene;
    this.moka.scale.set(0.2, 0.2, 0.2);
    this.moka.position.set(5, 0, 55);
    this.scene.add(this.moka);
    console.log(this.moka);
  }

  setRaycastClick() {
    const canvas = this.experience.canvas;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    canvas.addEventListener("click", (event) => {
      // 获取 canvas 的边界和鼠标位置
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      // 设置 raycaster
      raycaster.setFromCamera(mouse, this.camera.instance);
      // 检查交互
      const intersects = raycaster.intersectObject(this.moka, true);
      if (intersects.length > 0) {
        window.location.href = "./brewing/index.html";
      }
    });
  }
}
