import * as THREE from "three";
import Experience from "../Experience.js";
export default class Environment {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.setAmbientLight();
    this.setSunLight();
    this.setBrewLight();
  }

  setSunLight() {
    this.sunlight = new THREE.DirectionalLight("#ffffff", 6);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.camera.far = 15;
    this.sunlight.shadow.mapSize.set(1024, 1024);
    this.sunlight.shadow.normalBias = 0.05;
    this.sunlight.position.set(1.5, 1, -0.25);
    this.scene.add(this.sunlight);
    const helper = new THREE.DirectionalLightHelper(
      this.sunlight,
      0.5,
      0xff0000
    );
    this.scene.add(helper);
  }

  setAmbientLight() {
    const light = new THREE.AmbientLight(0x404040, 10); // soft white light
    this.scene.add(light);
  }

  setBrewLight() {
    this.brewlight = new THREE.DirectionalLight("#ffffff", 6);
    this.brewlight.position.set(0, 20, 50);
    this.scene.add(this.brewlight);
    const helper = new THREE.DirectionalLightHelper(
      this.brewlight,
      0.5,
      0xff0000
    );
    this.scene.add(helper);
  }
}
