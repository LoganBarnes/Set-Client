import React from 'react';
import * as THREE from 'three';
import './MainView.css';

//
//
//
class MainView extends React.Component {

  constructor() {
    super();

    // camera attributes
    const fovy          = 60.0;
    const initialAspect = 1.0;
    const near          = 0.1;
    const far           = 1500.0;

    const camera = new THREE.PerspectiveCamera(fovy, initialAspect, near, far);
    // camera.position.set(0.0, 15.0, 50.0);
    camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    // vertex buffer object for axes
    const vertices = buildAxisBuffer(21, 10.0);

    const axisGeom = new THREE.BufferGeometry();
    axisGeom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const axisMat  = new THREE.LineBasicMaterial({ color: 0x7f7f7f, linewidth: 1, });
    const axis     = new THREE.LineSegments(axisGeom, axisMat);

    const scene = new THREE.Scene();
    scene.add(axis);

    this.state = {
      renderer: null,
      camera: camera,
      scene: scene,
      angleHoriz: 0,
      angleVert: 15,
      zoom: 50,
      prevMousePos: null,
      mouseDown: false,
    }
  }

  //
  //
  //
  componentDidMount() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderParams = {
      canvas: document.getElementById("mainViewCanvas"),
      antialias: true,
    }
    const renderer = new THREE.WebGLRenderer(renderParams);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x555555, 1);
    renderer.setSize(w, h);

    const camera = this.updateCamera(
      this.state.angleHoriz,
      this.state.angleVert,
      this.state.zoom
    );
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const canvas = renderer.domElement;

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener  ('wheel', this.onMouseWheel.bind(this));
    canvas.addEventListener  ('mousedown', this.onMouseDown.bind(this));
    window.addEventListener  ('resize', this.onResize.bind(this));

    renderer.render(this.state.scene, camera);

    this.setState({
      renderer: renderer,
      camera: camera,
    });
  }

  //
  //
  //
  componentWillUnmount() {
    const canvas = this.state.renderer.canvas;

    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.removeEventListener  ('wheel', this.onMouseWheel.bind(this));
    canvas.removeEventListener  ('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener  ('resize', this.onResize.bind(this));
  }

  //
  //
  //
  render() {
    return (
      <div className="mainView" >
        <canvas id="mainViewCanvas" className="fullscreen"></canvas>
      </div>
    )
  }

  //
  //
  //
  renderGL() {
    if (this.state.renderer) {
      this.state.renderer.render(this.state.scene, this.state.camera);
    }
  }

  //
  //
  //
  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = this.state.renderer;
    const camera = this.state.camera;

    renderer.setSize(w, h);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.render(this.state.scene, camera);

    this.setState({
      renderer: renderer,
      camera: camera,
    });
  }

  //
  //
  //
  onMouseDown(mouseEvent) {
    const pos = getMousePos(mouseEvent, this.state.renderer.domElement);
    this.setState({
      mouseDown: true,
      prevMousePos: pos,
    });
    this.renderGL();
  }

  //
  //
  //
  onMouseMove(mouseEvent) {
    if (this.state.mouseDown) {
      const pos = getMousePos(mouseEvent, this.state.renderer.domElement);

      const deltaX = pos.x - this.state.prevMousePos.x;
      const deltaY = pos.y - this.state.prevMousePos.y;

      var angleHoriz = this.state.angleHoriz - deltaX * 0.25;
      var angleVert  = this.state.angleVert  + deltaY * 0.25;
      angleVert      = Math.max(-89.9, angleVert);
      angleVert      = Math.min( 89.9, angleVert);

      const camera = this.updateCamera(angleHoriz, angleVert, this.state.zoom);

      this.setState({
        camera: camera,
        angleHoriz: angleHoriz,
        angleVert: angleVert,
        prevMousePos: pos,
      });
      this.renderGL();
    }
  }

  //
  //
  //
  onMouseWheel(mouseEvent) {
    mouseEvent.preventDefault(); // no page scrolling when using the canvas


    var delta = mouseEvent.wheelDelta;
    if (!delta) {
      delta = mouseEvent.deltaY * 0.03;
    } else {
      delta *= 0.3;
    }
    var zoom = Math.max(0.001,  this.state.zoom + delta);
    zoom     = Math.min(1000.0, zoom);

    const camera = this.updateCamera(
      this.state.angleHoriz,
      this.state.angleVert,
      zoom
    );

    this.setState({
      camera: camera,
      zoom: zoom,
    });
    this.renderGL();
  }

  //
  //
  //
  onMouseUp(mouseEvent) {
    this.setState({
      mouseDown: false,
    });
    this.renderGL();
  }

  //
  //
  //
  updateCamera(angleHoriz, angleVert, zoom) {
    const camera = this.state.camera;
    var pos = new THREE.Vector3(0.0, 0.0, zoom);

    pos.applyAxisAngle(new THREE.Vector3(-1.0, 0.0, 0.0), deg2rad(angleVert));
    pos.applyAxisAngle(new THREE.Vector3( 0.0, 1.0, 0.0), deg2rad(angleHoriz));

    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    return camera;
  }
}

function buildAxisBuffer(numLines, spacing) {
  const size = numLines * 12;
  const vbo = new Float32Array(size);

  const radius = (numLines - 1) * 0.5 * spacing;

  var index = 0;
  for (var l = 0; l < numLines; ++l ) {
    vbo[index++] = -radius + l * spacing;
    vbo[index++] = 0.0;
    vbo[index++] = -radius;

    vbo[index++] = -radius + l * spacing;
    vbo[index++] = 0.0;
    vbo[index++] = radius;

    vbo[index++] = -radius;
    vbo[index++] = 0.0;
    vbo[index++] = -radius + l * spacing;

    vbo[index++] = radius;
    vbo[index++] = 0.0;
    vbo[index++] = -radius + l * spacing;
  }
  console.assert(index === size, {index: index, size: size});

  return vbo;
}

function getMousePos (event, element) {
  var rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function deg2rad (angle) {
  return angle * (Math.PI / 180);
}

export default MainView;
