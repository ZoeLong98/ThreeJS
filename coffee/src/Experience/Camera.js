import * as THREE from "three";
import Experience from "./Experience.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.debug = this.experience.debug;

    this.scroll = this.experience.scroll;
    this.catalog = this.experience.catalog;
    this.back = this.experience.back;
    this.startPosition = new THREE.Vector3(10, 30, 30);

    this.introLookatPosition = new THREE.Vector3(0, 0, 0);
    this.introPositon = new THREE.Vector3(15, 10, 20);

    this.mapLookatPosition = new THREE.Vector3(-50, 0, 0);
    this.mapPosition = new THREE.Vector3(-15, 0, 0);

    this.brewingPosition = new THREE.Vector3(0, 0, 30);
    this.brewingLookatPosition = new THREE.Vector3(0, 0, 50);

    this.camera = { far: 50 };
    this.setInstance();
    this.setOrbitControls();
    this.setCatalog();

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder("camera");
      this.debugFolder.add(this.camera, "far", 0, 100);
    }
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      35,
      this.sizes.width / this.sizes.height,
      0.1,
      this.camera.far
    );
    this.instance.position.copy(this.startPosition);
    this.scene.add(this.instance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.enabled = false;
    // const centerPolar = this.controls.getPolarAngle();
    // const delta = Math.PI / 12; // 允许上下各15度
    // this.controls.minPolarAngle = centerPolar - delta;
    // this.controls.maxPolarAngle = centerPolar + delta;
    // this.controls.minAzimuthAngle = -Math.PI / 6; // 左右各30度
    // this.controls.maxAzimuthAngle = Math.PI / 6;
  }

  resize() {
    console.log("camera resize" + this.sizes.width);
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
    this.instance.updateMatrixWorld();
  }

  update() {
    this.controls.update();
  }

  scrollUpdate() {
    if (!this.isAnimating && this.scroll.pageIndex === 0) {
      this.instance.position.lerpVectors(
        this.startPosition,
        this.introPositon,
        this.scroll.progress
      );
      // this.instance.lookAt(0, 0, 0);
    }
    this.instance.updateProjectionMatrix();
    this.instance.updateMatrixWorld();
  }

  moveCamera(targetPosition, lookatPosition, showCatalog) {
    gsap.to(this.instance.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: () => {
        if (!showCatalog) {
          this.catalog.forEach((cata) => {
            cata.style.display = "none";
          });
        }
      },
      onComplete: () => {
        this.controls.update();
        if (showCatalog) {
          this.catalog.forEach((cata) => {
            cata.style.display = "inline";
          });
        }
      },
    });
    gsap.to(this.controls.target, {
      x: lookatPosition.x,
      y: lookatPosition.y,
      z: lookatPosition.z,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: () => {
        this.controls.update();
      },
    });
  }

  setCatalog() {
    // map
    this.catalog[0].addEventListener("click", () => {
      this.isAnimating = true;
      this.controls.enabled = true;
      this.back.style.display = "inline";
      this.moveCamera(this.mapPosition, this.mapLookatPosition, false);

      this.back.onclick = () => {
        this.back.style.display = "none";
        this.controls.enabled = false;
        this.isAnimating = false;
        this.moveCamera(this.introPositon, this.introLookatPosition, true);
      };
    });
    //brewing
    this.catalog[2].addEventListener("click", () => {
      this.isAnimating = true;
      this.controls.enabled = true;
      this.back.style.display = "inline";
      this.moveCamera(this.brewingPosition, this.brewingLookatPosition, false);

      this.back.onclick = () => {
        this.back.style.display = "none";
        this.controls.enabled = false;
        this.isAnimating = false;
        this.moveCamera(this.introPositon, this.introLookatPosition, true);
      };
    });
  }
}
