import * as THREE from "three";
import Experience from "../Experience.js";
import Environment from "./Environment.js";
import CoffeeBean from "./coffeeBean.js";
import WorldMap from "./worldMap.js";
import BrewingTools from "./brewingTools.js";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.scroll = this.experience.scroll;
    this.catalog = this.experience.catalog;

    // Wait for resources
    this.resources.on("ready", () => {
      console.log("resources are ready");
      this.environment = new Environment();
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      this.coffeeBean = new CoffeeBean(false);
      this.worldMap = new WorldMap();
      this.brewingTools = new BrewingTools();
    });
  }

  catalogUpdate() {
    if (this.coffeeBean && this.scroll.pageIndex >= 1) {
      this.coffeeBean.update();
      const progress = this.scroll.catalogProgress;
      const total = this.catalog.length;

      for (let i = 0; i < total; i++) {
        const elemWidth = this.catalog[i].offsetWidth;
        let [x, y] = this.coffeeBean.screenPosition[i];
        if (i % 2 != 1) x -= elemWidth;
        const start = i / total;
        const end = (i + 1) / total;

        // 计算每个元素的局部进度 (0 到 1)
        let localProgress = (progress - start) / (end - start);
        localProgress = Math.min(Math.max(localProgress, 0), 1); // 限制在 [0,1]

        // 根据 localProgress 控制透明度和位移
        const opacity = localProgress; // 线性淡入
        const translateY = (1 - localProgress) * 50; // 初始向下偏移 50px

        this.catalog[i].style.opacity = opacity;
        this.catalog[i].style.transform = `translate(${x}px, ${
          y + translateY
        }px)`;
      }
    }
  }

  update() {
    this.catalogUpdate();
    if (this.worldMap) this.worldMap.animate();
  }
}
