import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#hologram-canvas");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-button");
const exitButton = document.querySelector("#exit-button");
const debugMessage = document.querySelector("#debug-message");

function setDebug(message) {
  console.log(message);
  if (debugMessage) {
    debugMessage.textContent = message;
  }
}

setDebug("main.js carregado.");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.autoClear = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  35,
  1,
  0.1,
  100
);

camera.position.set(0, 1.2, 5);
camera.lookAt(0, 0, 0);

const group = new THREE.Group();
scene.add(group);

const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(3, 5, 4);
scene.add(directionalLight);

let model = null;

const clock = new THREE.Clock();

const loader = new GLTFLoader();

setDebug("Tentando carregar: ./assets/castle.glb");

loader.load(
  "./assets/castle.glb",

  (gltf) => {
    setDebug("Modelo carregado com sucesso.");

    model = gltf.scene;
    normalizeModel(model);
    group.add(model);
  },

  (progress) => {
    if (progress.total > 0) {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      setDebug(`Carregando modelo: ${percent}%`);
    }
  },

  (error) => {
    console.error("Erro ao carregar modelo:", error);
    setDebug("Erro ao carregar castle.glb. Verifique o nome e a pasta assets.");
  }
);

function normalizeModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z);
  const scale = 2.8 / maxAxis;

  object.scale.multiplyScalar(scale);

  object.position.x -= center.x * scale;
  object.position.y -= center.y * scale;
  object.position.z -= center.z * scale;
}

function renderHologramViews() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.clear();

  camera.aspect = 1;
  camera.updateProjectionMatrix();

  const margin = 12;

  const availableWidth = width - margin * 2;
  const availableHeight = height - margin * 2;

  const cellSizeByWidth = availableWidth / 3;
  const cellSizeByHeight = availableHeight / 3;

  const viewSize = Math.floor(Math.min(cellSizeByWidth, cellSizeByHeight));

  const gridWidth = viewSize * 3;
  const gridHeight = viewSize * 3;

  const startX = Math.floor((width - gridWidth) / 2);
  const startY = Math.floor((height - gridHeight) / 2);

  const views = [
    {
      name: "top",
      col: 1,
      row: 0,
      rotationZ: Math.PI
    },
    {
      name: "left",
      col: 0,
      row: 1,
      rotationZ: -Math.PI / 2
    },
    {
      name: "right",
      col: 2,
      row: 1,
      rotationZ: Math.PI / 2
    },
    {
      name: "bottom",
      col: 1,
      row: 2,
      rotationZ: 0
    }
  ];

  for (const view of views) {
    const x = startX + view.col * viewSize;
    const y = startY + view.row * viewSize;

    renderer.setViewport(
      x,
      height - y - viewSize,
      viewSize,
      viewSize
    );

    renderer.setScissor(
      x,
      height - y - viewSize,
      viewSize,
      viewSize
    );

    renderer.setScissorTest(true);

    group.rotation.z = view.rotationZ;

    renderer.render(scene, camera);
  }

  renderer.setScissorTest(false);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (model) {
    model.rotation.y += delta * 0.35;
  }

  renderHologramViews();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
}

async function enterExperience() {
  setDebug("Botão iniciar clicado.");

  startScreen.style.display = "none";
  exitButton.style.display = "inline-flex";

  const element = document.documentElement;

  if (element.requestFullscreen) {
    try {
      await element.requestFullscreen();
      setDebug("Tela cheia ativada.");
    } catch (error) {
      console.warn("Não foi possível entrar em tela cheia:", error);
      setDebug("Tela cheia bloqueada, mas visualização iniciada.");
    }
  }
}

async function exitExperience() {
  setDebug("Voltando para a tela inicial.");

  startScreen.style.display = "flex";
  exitButton.style.display = "none";

  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.warn("Não foi possível sair da tela cheia:", error);
    }
  }
}

window.addEventListener("resize", resize);

startButton.addEventListener("click", enterExperience);
exitButton.addEventListener("click", exitExperience);

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && startScreen.style.display === "none") {
    exitButton.style.display = "inline-flex";
  }
});

animate();