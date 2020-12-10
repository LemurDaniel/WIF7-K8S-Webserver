let octahedron;

function preload() {
  octahedron = loadModel('Pickaxe ganz.stl');
}

function setup() {
  createCanvas(500, 500, WEBGL);
}

function draw() {
  background(200);
  scale(20);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  model(octahedron);
}