export default [
  {
    name: "environmentMapTexture",
    type: "cubeTexture",
    // CubeTextureLoader requires 6 face images in this exact order: px, nx, py, ny, pz, nz
    // Paths are resolved from Vite's root (src/) with static assets served from ../static/
    path: [
      "./textures/environmentMap/px.jpg",
      "./textures/environmentMap/nx.jpg",
      "./textures/environmentMap/py.jpg",
      "./textures/environmentMap/ny.jpg",
      "./textures/environmentMap/pz.jpg",
      "./textures/environmentMap/nz.jpg",
    ],
  },
  {
    name: "coffeeBeanModel",
    type: "gltfModel",
    path: "./models/coffeeBean/coffeeBean.glb",
  },
  {
    name: "brewingTools_Moka",
    type: "gltfModel",
    path: "./models/brewingTools/moka_pot.glb",
  },
];
