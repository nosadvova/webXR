import * as THREE from "three";

import { ARButton } from "three/addons/webxr/ARButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let sphereMesh, cylinderMesh, planeMesh, glowParticles;
let controls;

let rotationEnabled = true;
let pulseMoveEnabled = true;
let colorEmitEnabled = true;
let texturesEnabled = true;
let speedMode = "normal";
let rotationDirection = 1;
let specialEffectActive = false;
let specialEffectTimer = 0;

const textureLoader = new THREE.TextureLoader();

let texture1, texture2, texture3;

textureLoader.load(
  "https://threejs.org/examples/textures/brick_diffuse.jpg",
  (t1) => {
    texture1 = t1;
    textureLoader.load(
      "https://threejs.org/examples/textures/uv_grid_opengl.jpg",
      (t2) => {
        texture2 = t2;
        textureLoader.load(
          "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
          (t3) => {
            texture3 = t3;
            init();
            animate();
          }
        );
      }
    );
  }
);

const emissiveMetalicMaterial = new THREE.MeshStandardMaterial({
  color: 0x7f42f5,
  metalness: 0.75,
  roughness: 0.35,
  emissive: 0x111111,
  emissiveIntensity: 1,
});

let emissiveMetalicMaterialTexture;
let rigidMaterialTexture;
let greenWireframeTexture;

const rigidMaterial = new THREE.MeshPhongMaterial({
  color: 0xf5a142,
  shininess: 60,
  specular: 0xcccccc,
  flatShading: true,
});

const greenWireframe = new THREE.MeshBasicMaterial({
  color: 0x42f58d,
  wireframe: true,
});

function init() {
  emissiveMetalicMaterialTexture = new THREE.MeshStandardMaterial({
    map: texture1,
    metalness: 0.75,
    roughness: 0.35,
    emissive: 0x111111,
    emissiveIntensity: 1,
  });

  rigidMaterialTexture = new THREE.MeshPhongMaterial({
    map: texture2,
    shininess: 60,
    specular: 0xcccccc,
    flatShading: true,
  });

  greenWireframeTexture = new THREE.MeshBasicMaterial({
    map: texture3,
    wireframe: false,
  });

  const container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    40
  );
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const pointLight = new THREE.PointLight(0xffffff, 10, 10);
  pointLight.position.set(-2, 2, 2);
  scene.add(pointLight);

  const dir = new THREE.DirectionalLight(0xffffff, 4);
  dir.position.set(3, 3, 3);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));

  sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.8),
    emissiveMetalicMaterialTexture
  );
  sphereMesh.position.set(-1.5, 0, -5);
  scene.add(sphereMesh);

  cylinderMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2),
    rigidMaterialTexture
  );
  cylinderMesh.position.set(0, 0, -5);
  scene.add(cylinderMesh);

  planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    greenWireframeTexture
  );
  planeMesh.position.set(1.5, 0, -5);
  scene.add(planeMesh);

  // Cool special effect: glowing particles
  const glowGeometry = new THREE.BufferGeometry();
  const glowCount = 100;
  const glowPositions = new Float32Array(glowCount * 3);
  for (let i = 0; i < glowCount * 3; i++) {
    glowPositions[i] = (Math.random() - 0.5) * 10;
  }
  glowGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(glowPositions, 3)
  );
  const glowMaterial = new THREE.PointsMaterial({
    color: 0xffffaa,
    size: 0.2,
    transparent: true,
    opacity: 0,
  });
  glowParticles = new THREE.Points(glowGeometry, glowMaterial);
  scene.add(glowParticles);

  camera.position.z = 3;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const button = ARButton.createButton(renderer);
  document.body.appendChild(button);

  window.addEventListener("resize", onWindowResize, false);

  safeAddEventListener("toggleRotationBtn", toggleRotation);
  safeAddEventListener("togglePulseBtn", togglePulseMove);
  safeAddEventListener("toggleColorBtn", toggleColorEmit);
  safeAddEventListener("toggleTexturesBtn", toggleTextures);
  safeAddEventListener("toggleSpeedBtn", toggleSpeed);
  safeAddEventListener("toggleDirectionBtn", toggleDirection);
  safeAddEventListener("specialEffectBtn", triggerSpecialEffect);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    if (!renderer.xr.isPresenting) controls.update();
    render();
  });
}

function render() {
  const speed = speedMode === "normal" ? 1 : 2;
  const time = performance.now() * 0.001 * speed;

  if (rotationEnabled) {
    sphereMesh.rotation.y += 0.01 * rotationDirection * speed;
    cylinderMesh.rotation.x += 0.01 * rotationDirection * speed;
    planeMesh.rotation.z += 0.01 * rotationDirection * speed;
  }

  if (pulseMoveEnabled) {
    const scale = 1 + 0.1 * Math.sin(time * 2);
    sphereMesh.scale.set(scale, scale, scale);
    cylinderMesh.scale.set(scale, scale, scale);
    planeMesh.scale.set(scale, scale, scale);
  }

  if (colorEmitEnabled) {
    const glow = 1 + Math.sin(time * 3);
    emissiveMetalicMaterial.emissive.setHSL(
      0.75,
      1,
      0.5 + 0.2 * Math.sin(time)
    );
    emissiveMetalicMaterial.emissiveIntensity = glow;
    if (emissiveMetalicMaterialTexture) {
      emissiveMetalicMaterialTexture.emissive.setHSL(
        0.75,
        1,
        0.5 + 0.2 * Math.sin(time)
      );
      emissiveMetalicMaterialTexture.emissiveIntensity = glow;
    }
  }

  if (specialEffectActive) {
    specialEffectTimer += 0.01 * speed;
    const flicker = Math.abs(Math.sin(specialEffectTimer * 10));
    planeMesh.material.opacity = 0.3 + 0.7 * flicker;
    planeMesh.material.transparent = true;
    glowParticles.material.opacity = 1 - specialEffectTimer / 5;
    if (specialEffectTimer > 5) {
      specialEffectActive = false;
      planeMesh.material.opacity = 1;
      glowParticles.material.opacity = 0;
    }
  }

  renderer.render(scene, camera);
}

function toggleTextures() {
  texturesEnabled = !texturesEnabled;
  const btn = document.getElementById("toggleTexturesBtn");
  if (btn)
    btn.textContent = texturesEnabled ? "Disable Textures" : "Enable Textures";

  sphereMesh.material = texturesEnabled
    ? emissiveMetalicMaterialTexture
    : emissiveMetalicMaterial;
  cylinderMesh.material = texturesEnabled
    ? rigidMaterialTexture
    : rigidMaterial;
  planeMesh.material = texturesEnabled ? greenWireframeTexture : greenWireframe;

  sphereMesh.material.needsUpdate = true;
  cylinderMesh.material.needsUpdate = true;
  planeMesh.material.needsUpdate = true;
}

function safeAddEventListener(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", handler);
}

function toggleRotation() {
  rotationEnabled = !rotationEnabled;
  const btn = document.getElementById("toggleRotationBtn");
  if (btn)
    btn.textContent = rotationEnabled ? "Disable Rotation" : "Enable Rotation";
}

function togglePulseMove() {
  pulseMoveEnabled = !pulseMoveEnabled;
  const btn = document.getElementById("togglePulseBtn");
  if (btn)
    btn.textContent = pulseMoveEnabled
      ? "Disable Pulse/Move"
      : "Enable Pulse/Move";
}

function toggleColorEmit() {
  colorEmitEnabled = !colorEmitEnabled;
  const btn = document.getElementById("toggleColorBtn");
  if (btn)
    btn.textContent = colorEmitEnabled
      ? "Disable Color/Emit"
      : "Enable Color/Emit";
}

function toggleSpeed() {
  speedMode = speedMode === "normal" ? "fast" : "normal";
  const btn = document.getElementById("toggleSpeedBtn");
  if (btn)
    btn.textContent = `Speed: ${
      speedMode.charAt(0).toUpperCase() + speedMode.slice(1)
    }`;
}

function toggleDirection() {
  rotationDirection *= -1;
  const btn = document.getElementById("toggleDirectionBtn");
  if (btn)
    btn.textContent =
      rotationDirection === 1 ? "Direction: Forward" : "Direction: Backward";
}

function triggerSpecialEffect() {
  specialEffectActive = true;
  specialEffectTimer = 0;
  glowParticles.material.opacity = 1;
}
