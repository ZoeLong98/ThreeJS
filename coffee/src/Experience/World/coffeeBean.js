import * as THREE from "three";
import Experience from "../Experience.js";

export default class CoffeeBean {
  constructor(showIntersection = true) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.size = this.experience.sizes;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;

    this.showIntersection = showIntersection;

    // Setup
    this.resource = this.resources.items.coffeeBeanModel;
    this.origin = new THREE.Vector3(0, 0, 5);
    this.intersection = [];
    this.directions = [
      new THREE.Vector3(-0.1, 1.1, -1).normalize(),
      new THREE.Vector3(0.6, 1.0, -1).normalize(),
      new THREE.Vector3(-0.2, 0.5, -1).normalize(),
      new THREE.Vector3(0.8, 0.5, -1).normalize(),
    ];
    this.screenPosition = [];

    this.setModel();
    this.setIntersectionPoint();
  }

  setModel() {
    this.model = this.resource.scene;
    this.model.scale.set(1, 1, 1);
    this.model.position.set(0, 0, 0);
    this.scene.add(this.model);
  }

  setIntersectionPoint() {
    const raycaster = new THREE.Raycaster();

    // 遍历所有子 Mesh，确保双面材质
    this.meshes = [];
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        this.meshes.push(child);
      }
    });

    for (let i = 0; i < this.directions.length; i++) {
      raycaster.set(this.origin, this.directions[i]);

      if (this.showIntersection) {
        const lineLength = 5; // 射线可视化长度
        const points = [
          this.origin,
          this.origin
            .clone()
            .add(this.directions[i].clone().multiplyScalar(lineLength)),
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
      }

      // 计算交点
      this.meshes.forEach((mesh) => {
        const intersects = raycaster.intersectObject(mesh, false);
        if (intersects.length > 0) {
          const screenPosition = intersects[0].point.project(
            this.camera.instance
          );
          const screenX = ((screenPosition.x + 1) / 2) * this.size.width;
          const screenY = ((-screenPosition.y + 1) / 2) * this.size.height;
          this.screenPosition.push([screenX, screenY]);
          this.intersection.push(intersects[0].point);
        }
      });
    }
  }

  update() {
    this.screenPosition = [];
    this.intersection = [];
    const raycaster = new THREE.Raycaster();
    for (let i = 0; i < this.directions.length; i++) {
      raycaster.set(this.origin, this.directions[i]);
      this.meshes.forEach((mesh) => {
        const intersects = raycaster.intersectObject(mesh, false);
        if (intersects.length > 0) {
          const screenPosition = intersects[0].point.project(
            this.camera.instance
          );
          const screenX = ((screenPosition.x + 1) / 2) * this.size.width;
          const screenY = ((-screenPosition.y + 1) / 2) * this.size.height;
          this.screenPosition.push([screenX, screenY]);
          this.intersection.push(intersects[0].point);
        }
      });
    }
  }
}
