import * as THREE from 'three';
import gsap from 'gsap';

import { transition } from './script';

// const intervalTransition = gsap.utils.interpolate(0, 1);

export default class TransitionScene {
  constructor(currentSceneFBO, transitionSceneFBO) {
    this.scene = new THREE.Scene();

    this.currentSceneFBO = currentSceneFBO;
    this.transitionSceneFBO = transitionSceneFBO;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 3;
    this.scene.add(this.camera);

    const transitionTexture = new THREE.TextureLoader().load('/transition1.png');

    this.quadGeom = new THREE.PlaneGeometry(2, 2);
    this.quadMat = new THREE.ShaderMaterial({
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
    gl_FragColor = mix( texture2D(uScene2Texture, vUv), texture2D(uScene1Texture, vUv), mixf );
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
          value: null,
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

    if (this.currentSceneFBO) this.quadMat.uniforms.uScene1Texture.value = this.currentSceneFBO.texture;
    if (this.transitionSceneFBO) this.quadMat.uniforms.uScene2Texture.value = this.transitionSceneFBO.texture;

    this.plane = new THREE.Mesh(this.quadGeom, this.quadMat);

    this.plane.renderOrder = 1;
    this.scene.add(this.plane);
  }

  setTransition(transitionSceneFBO) {
    this.transitionSceneFBO = transitionSceneFBO;
    this.quadMat.uniforms.uScene2Texture.value = this.transitionSceneFBO;
    console.log(this.quadMat.uniforms);
    gsap.to(
      {},
      {
        onUpdate() {
          //   console.log(this.ratio);
          //   this.quadMat.uniforms.uLerp.value = intervalTransition(timer);
          transition(this.ratio);
        },
        duration: 2,
        onComplete: () => {
          console.log('transition complète');
          console.log(this.currentSceneFBO);
          console.log(this.transitionSceneFBO);
        },
      }
    );
  }
}
