import * as THREE from "three";
import Experience from "../Experience";
import { gsap } from "gsap/gsap-core";
import vertexShader from "../../shader/worldMapShader/vertex.glsl";
import fragmentShader from "../../shader/worldMapShader/fragment.glsl";

const country = { Brazil: ["1"] };

export default class WorldMap {
  constructor() {
    console.log("inside worldMap");
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.size = this.experience.sizes;
    this.line = this.experience.line;

    this.R = 7;
    this.countryGroup = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.position = new THREE.Vector3(-50, 0, 0);
    this.animating = true;
    this.autoRotateAxis = new THREE.Vector3(0, 1, 0); // y轴
    this.autoRotateSpeed = 0.001;
    this.text = document.getElementById("label");
    this.guideLine = document.getElementById("guide-line");

    this.fetchData();
    window.addEventListener("click", (event) => {
      this.onMouseClick(event);
    });
  }

  latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  addCountryLineandMesh(ring, countryName) {
    // create group for country
    const countryGroup = new THREE.Group();
    countryGroup.name = countryName;
    countryGroup.userData.country = countryName;

    // Line
    const points = ring.map(([lon, lat]) =>
      this.latLonToVector3(lat, lon, this.R)
    );
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const shadermaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uCenter: new THREE.Uniform(this.position),
      },
    });
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
    });
    const line = new THREE.Line(geometry, shadermaterial);
    countryGroup.add(line);

    if (countryName in country) {
      // 计算中心点
      let center = new THREE.Vector3();
      points.forEach((p) => center.add(p));
      center.divideScalar(points.length);

      // 可视化中心点
      const centerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      centerMesh.position.copy(center);
      countryGroup.userData.center = center;
    }

    // Mesh
    const shapePoints = ring.map(([lon, lat]) => new THREE.Vector2(lon, lat));
    const shape = new THREE.Shape(shapePoints);
    const geometry2d = new THREE.ShapeGeometry(shape);

    const pos = geometry2d.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lat = pos.getY(i);
      const lon = pos.getX(i);
      const v3 = this.latLonToVector3(lat, lon, this.R + 0.01); // +0.01避免z-fighting
      pos.setXYZ(i, v3.x, v3.y, v3.z);
    }

    const color = countryName in country ? 0x532e21 : 0x000000;
    const opacity = countryName in country ? 1 : 0.5;
    const materialMesh = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.FrontSide,
      transparent: true,
      opacity: opacity,
    });
    const mesh = new THREE.Mesh(geometry2d, materialMesh);
    countryGroup.add(mesh);

    this.countryGroup.add(countryGroup);
  }

  fetchData() {
    console.log("fetching data");
    fetch("./map.json")
      .then((res) => res.json())
      .then((geojson) => {
        geojson.features.forEach((feature) => {
          const geometryType = feature.geometry.type;
          const coords = feature.geometry.coordinates;
          const countryName =
            feature.properties.Name || feature.properties.ADMIN || "UnKnown";

          if (geometryType === "Polygon") {
            coords.forEach((ring) =>
              this.addCountryLineandMesh(ring, countryName)
            );
          } else if (geometryType === "MultiPolygon") {
            coords.forEach((polygon) =>
              polygon.forEach((ring) =>
                this.addCountryLineandMesh(ring, countryName)
              )
            );
          }
        });
      });
    this.countryGroup.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );
    this.scene.add(this.countryGroup);
  }

  rotateToMiddle(center) {
    this.animating = false;
    const worldcenter = center
      .clone()
      .applyMatrix4(this.countryGroup.matrixWorld);
    // 1. 球心到国家中心方向
    const currentDir = worldcenter.clone().sub(this.position).normalize();
    // 2. 球心到相机方向
    const targetDir = this.camera.instance.position
      .clone()
      .sub(this.position)
      .normalize();
    // 3. 旋转轴和角度
    const axis = new THREE.Vector3()
      .crossVectors(currentDir, targetDir)
      .normalize();
    const angle = Math.acos(currentDir.dot(targetDir));
    // 4. 计算目标四元数
    const startQuat = this.countryGroup.quaternion.clone();
    const endQuat = startQuat.clone();
    if (axis.lengthSq() > 1e-6) {
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(axis, angle);
      endQuat.premultiply(q);
    }

    // 5. 动画插值
    gsap.to(this.countryGroup.quaternion, {
      x: endQuat.x,
      y: endQuat.y,
      z: endQuat.z,
      w: endQuat.w,
      duration: 1.2,
      ease: "power2.inOut",
    });
  }

  getCountryGroup(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera.instance);
    const intersects = this.raycaster.intersectObjects(
      this.countryGroup.children,
      true
    );
    if (intersects.length === 0) return null;
    return intersects[0];
  }

  animate() {
    if (this.animating)
      this.countryGroup.rotateOnAxis(this.autoRotateAxis, this.autoRotateSpeed);
  }

  showCoffeeName(countryName) {
    this.line.style.display = "inline";
    this.text.textContent = countryName;
    gsap.to("#guide-line", {
      duration: 1.5,
      attr: { x2: 80, y2: 35 },
      strokeDashoffset: 0,
      ease: "power2.out",
      delay: 1,
    });

    gsap.to("#label", {
      duration: 0.8,
      opacity: 1,
      delay: 2.5,
      ease: "power1.inOut",
    });
  }

  hideCoffeeBean() {
    this.guideLine.setAttribute("x2", "50");
    this.guideLine.setAttribute("y2", "50");
    this.guideLine.setAttribute("stroke-dashoffset", "36");
    this.text.style.opacity = 0;
    this.line.style.display = "none";
  }

  onMouseClick(event) {
    const intersect = this.getCountryGroup(event);
    if (!intersect) {
      this.animating = true;
      this.hideCoffeeBean();
      return;
    }
    let obj = intersect.object;
    while (obj && obj.parent && !obj.userData.country) {
      obj = obj.parent;
    }
    const countryName = obj.userData.country;
    if (countryName in country) {
      this.rotateToMiddle(obj.userData.center);
      this.showCoffeeName(countryName);
    } else {
      this.hideCoffeeBean();
      this.animating = true;
      return;
    }
  }
}
