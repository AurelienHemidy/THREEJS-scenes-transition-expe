import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import * as dat from 'lil-gui';
import { Mesh, Plane, PlaneBufferGeometry, PlaneGeometry, ShaderMaterial } from 'three';

/**
 * Base
 */
const parameters = {
  color: 0xff0000,
  spin: () => {
    gsap.to(mesh.rotation, 1, { y: mesh.rotation.y + Math.PI * 2 });
  },
  changeScene: () => {},
  transitionValue: 0,
};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

const scene2 = new THREE.Scene();

scene2.background = new THREE.Color(0x0000ff);

const scene3 = new THREE.Scene();

scene3.background = new THREE.Color(0x00ffff);

/**
 * Object
 */
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
scene3.add(mesh);

const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const mesh2 = new THREE.Mesh(geometry2, material2);
scene2.add(mesh2);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// RenderTarget

const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height);
const renderTarget2 = new THREE.WebGLRenderTarget(sizes.width, sizes.height);

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

const camera2 = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera2.position.z = 3;
scene2.add(camera2);
const camera3 = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera3.position.z = 3;
scene3.add(camera3);

const transitionTexture = new THREE.TextureLoader().load('/transition1.png');

const quadGeom = new PlaneGeometry(2, 2);
const quadMat = new ShaderMaterial({
  fragmentShader: `
  uniform sampler2D uScene1Texture;
  uniform sampler2D uScene2Texture;
  uniform sampler2D uTransitionTexture;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uLerp;
  void main() {
    //vec2 screenUv = (gl_FragCoord.xy / uResolution);
    
    float threshold = 0.3;
    vec4 transitionTexel = texture2D( uTransitionTexture, vUv );
    float r = uLerp * (1.0 + threshold * 2.0) - threshold;
    float mixf = clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);

    //gl_FragColor = vec4( mix( texture2D(uScene1Texture, vUv).xyz, texture2D(uScene2Texture, vUv).xyz, uLerp ), 1. );
    gl_FragColor = mix( texture2D(uScene1Texture, vUv), texture2D(uScene2Texture, vUv), mixf );
    //gl_FragColor = texture2D(uTransitionTexture, vUv);
  }
  `,
  vertexShader: `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
    
  }`,
  uniforms: {
    uScene1Texture: {
      value: renderTarget.texture,
    },
    uScene2Texture: {
      value: null,
    },
    uLerp: {
      value: 0.0,
    },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTransitionTexture: {
      value: transitionTexture,
    },
  },
  transparent: true,
  depthTest: false,
});

const plane = new Mesh(quadGeom, quadMat);

plane.renderOrder = 1;
scene.add(plane);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Debug
 */
const gui = new dat.GUI({
  // closed: true,
  width: 400,
});
// gui.hide()
gui.add(mesh.position, 'y').min(-3).max(3).step(0.01).name('elevation');
gui.add(mesh, 'visible');
gui.add(material, 'wireframe');

window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    if (gui._hidden) gui.show();
    else gui.hide();
  }
});

gui.addColor(parameters, 'color').onChange(() => {
  material.color.set(parameters.color);
});

gui.add(parameters, 'spin');
gui.add(parameters, 'changeScene');
gui
  .add(parameters, 'transitionValue')
  .min(0)
  .max(1)
  .step(0.01)
  .name('transition value')
  .onChange((value) => {
    quadMat.uniforms.uLerp.value = value;
  });

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  mesh2.rotation.x += 0.02;
  mesh2.rotation.y += 0.02;

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene2, camera2);
  renderer.setRenderTarget(null);
  renderer.setRenderTarget(renderTarget2);
  renderer.render(scene3, camera3);
  renderer.setRenderTarget(null);

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
