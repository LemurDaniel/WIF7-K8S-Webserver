
url_save = window.location.origin+'/space/score';

var canvas_loaded = 0;
var ship;
var asteroids;
var collided_ast;
var gamestate;
var score;

const shot_points = 20;
const surviving_points = 1; // per second

const sizex = 800;
const sizey = 800;
const salce_factor = 0.8;


function setup() {
  if(gamestate && gamestate == 'RUNNING') return;
  if(!canvas_loaded) {
    canvas = createCanvas(sizey*salce_factor, sizex*salce_factor);
    canvas.parent('#div_game');
    document.querySelector('#restart').addEventListener('click', () => setup() );
    canvas_loaded = true;
  }
  delete ship;
  delete asteroids;

  ship = new Ship(sizey/2, sizex/2, radians(-90));
  asteroids = new Asteriods(10);
  gamestate = 'RUNNING';
  score = 0;

  document.querySelector('#restart').classList.add('hidden');

  frameRate(60);
}

function draw() {
  background(0);
  
  if(frameCount % 60 == 0)  score += surviving_points;

  scale(salce_factor);

  ship.draw();
  push();
  translate(256, 32);
  textSize(32);
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  text('Score: ' + score + ' Points', 0, 0);
  pop();
  
  if(gamestate == 'RUNNING') asteroids.draw();

  
  else if(gamestate == 'END') {
    asteroids.draw(collided_ast);
 
    push();
    translate(sizey/2, sizex/2);
    textSize(64);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    text('Game Over', 0, 0);
    pop();

    httpPost(url_save, 'json',  { score: score }, (result) => { console.log(result) });
    document.querySelector('#restart').classList.remove('hidden');
    frameRate(0);

    gamestate == 'PRESTART';
  }
}

function vectorOOB(vec, treshold) {
  if(vec.x < 0-treshold || vec.x > sizex+treshold ) return true;
  if(vec.y < 0-treshold || vec.y > sizey+treshold ) return true;
  return false;
}

function Ship(x, y, angle) {
  
  this.angle = angle;
  this.steer_angle = 0.05;
  
  this.vectorV = createVector(0,0);
  this.maxV = 10;
  this.friction = 0.05;
  
  this.pos = createVector(x,y);
  this.magnitude = 5;
  
  this.move = function () {
  
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) ) this.angle -= this.steer_angle;
    else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) ) this.angle += this.steer_angle;
    
    keyPressed = () => {
      if(keyCode == UP_ARROW || keyCode == 87)
        this.vectorV.add(p5.Vector.fromAngle(this.angle, this.magnitude));
     if(keyCode == 32)
       this.cannon.shoot(this.pos.copy(), p5.Vector.fromAngle(this.angle, 2));
    }
    
    this.vectorV.limit(this.maxV);
    
    this.vectorV.x += -this.friction * Math.sign(this.vectorV.x);
    this.vectorV.y += -this.friction * Math.sign(this.vectorV.y);
      
    if(abs(this.vectorV.x) < 0.05 ) this.vectorV.x = 0; 
    if(abs(this.vectorV.y) < 0.05 ) this.vectorV.y = 0; 
    
    
    this.pos.add(this.vectorV);
    
    //OOB
    this.pos.rem(createVector(sizex, sizey));
    if(this.pos.x < 0) this.pos.x = sizex;
    if(this.pos.y < 0) this.pos.y = sizey;
  }
  
  this.cannon = {
    
    speed: 15,
    bullets: [],
    shoot: function(pos, direction) { 
      this.bullets.push({ pos: pos, direction: direction.setMag(this.speed), alive: 1} ) },
    
    drawBullets: function(){

      for(let i=0; i <this.bullets.length; i++){
        const bullet = this.bullets[i];
        if(!bullet || bullet == 0 || !bullet.alive) continue;
        
        push();    
        translate(bullet.pos);
        rotate(bullet.direction.heading() - radians(90));
        rect(-2 , 10, 5,20);
        pop();
        
        bullet.pos.add(bullet.direction);
        if(vectorOOB(bullet.pos, 0)) bullet.alive = 0; 
      }
       if(frameCount%60 == 0) this.bullets = this.bullets.filter( (bullet) =>  bullet.alive );
    }
  }
  
  this.draw = function(){
  
    this.move();
    push();
    
    stroke(255);
    strokeWeight(2);
    noFill();
    
    translate(this.pos.x, this.pos.y);
    rotate(this.angle + radians(90));
    rectMode(CENTER);
    
    triangle(0,-20, 20,20, -20,20);
    rect(-10,23, 10,5);
    rect(10,23, 10,5);
    rect(0,-20, 2,10);
   
    pop();
    
    this.cannon.drawBullets();
  }
  
}

//ASTEROIDS

function Buffer(size) {
               
  this.buffer = [];
  this.size = size+1;
  this.point_end = 0;
  this.point_start = 0;
  
  this.isFull = () => (this.point_end+1)%this.size == this.point_start;
  this.isEmpty = () => this.point_start == this.point_end;
  
  
  this.push = function(data) {
    if(this.isFull()) throw "Buffer is full";
    this.buffer[this.point_end] = data;
    this.point_end = (this.point_end+1)%this.size;
  }
  this.pop = function(){
    if(this.isEmpty()) throw "Buffer is Empty";
    data = this.buffer[this.point_start];
    this.point_start = (this.point_start+1)%this.size;
    return data;
  }
}

function Asteriods(amount) {
  
  this.asteriods = [];
  this.amount = amount;
  this.freeSpaces = new Buffer(amount);
  this.dmmax = 1.5;
  this.dmmin = 0.8;

  for(let i=0; i<amount; i++) { this.freeSpaces.push(i); }
  
  
  this.randomPos = function () {
    const rand = floor(random(0,4));
    if(rand == 0) return createVector(random(-50,-20), random(0, sizey));
    else if(rand == 1) return createVector(random(sizex,sizey+50), random(0, sizey));
    else if(rand == 2) return createVector(random(0, sizey), random(-50,-20));
    else if(rand == 3) return createVector(random(0, sizey), random(sizex,sizey+50));
  }
  
  this.test = 0;
  this.createAsteroids = function() {

    const vectors = [];
    for(let i=0; i <7; i++){
        vectors.push(p5.Vector.random2D().setMag(random(4,8)));
    }
     
    const pos = this.randomPos();
    const vector_to_ship = ship.pos.copy().sub(pos);
    const direction = p5.Vector.fromAngle(vector_to_ship.heading()+ radians(random(-30, 30)) );

    ast = {
      pos: pos,
      //direction: p5.Vector.fromAngle(radians(random(0,360))).setMag(random(0.1, 1.5)),
      direction: direction.setMag(random(this.dmmin, this.dmmax)),
      vectors: vectors,
      collision_rad: 40,
      alive: 1,
      garbage: 0,
      array_index: this.freeSpaces.pop(),
      state: 0,
      blinks: 10,
      wait: 10,
      wait_amount: 5,
      points_multiplier: random(0.8, 1.2)
    }
    
    this.asteriods[ast.array_index] = ast;
  }
  

  this.draw = function(index) {
    
    
      for(let i=0; i <this.asteriods.length; i++){
        if(index && i != index) continue;
        
        const ast = this.asteriods[i];
        if(!ast || ast == 0 || ast.garbage) continue;
        
        this.collision_check(ast, ship.cannon.bullets);
        this.collision_self(ast);
        if(!vectorOOB(ast.pos) && ast.pos.dist(ship.pos) < ast.collision_rad) {  
          gamestate = 'END'; // when collided with ship
          collided_ast = ast.array_index;
        }
        
        push();   
        translate(ast.pos);
        //rotate(ast.direction.heading());
        
        noFill();
        stroke(255);
        let v = ast.vectors;
        if(!ast.alive) this.die_anim(ast);
        
        beginShape();
        vertex(-30+v[6].x, -20+v[6].y);
        vertex(-5+v[0].x, -30+v[0].y);
        vertex(20+v[1].x, -25+v[1].y);
        vertex(25+v[2].x, 0+v[2].y);
        vertex(15+v[3].x, 20+v[3].y);
        vertex(-5+v[4].x, 25+v[4].y);
        vertex(-20+v[5].x, 5+v[5].y);
        vertex(-30+v[6].x, -20+v[6].y);
        endShape();
        
        //circle(0,0, ast.collision_rad) //collision Bounds 
        pop();
        
        if(ast.direction.mag() < this.dmmin) ast.direction.setMag(this.dmmin, this.dmmax);
        ast.pos.add(ast.direction);
 
        if(ast.pos.x < -80) ast.pos.x = sizex+40;
        if(ast.pos.y < -80) ast.pos.y = sizey+40;
        if(ast.pos.x > sizex+80) ast.pos.x = -40;
        if(ast.pos.y > sizey+80) ast.pos.y = -40;
      }
    
      if(!this.freeSpaces.isEmpty() && frameCount % 60 == 0) 
        this.createAsteroids();
  }
  
  this.die_anim = function(ast) {
    if(ast.state == 0) noStroke();
    else stroke(255);
    
    ast.wait--;
    if(ast.wait >= 0) return;
    ast.state = (ast.state+1)%2;
    ast.wait = ast.wait_amount;
    ast.wait_amount--;
    ast.blinks--;
    if(ast.blinks == 0) {
      ast.garbage = 1;
      this.freeSpaces.push(ast.array_index);
    }
  }
  
  this.collision_check = function(ast, bullets) {

      if(!ast.alive) return;
      
      //Check ast against all bullets
      for(let i=0; i<bullets.length; i++){
        const bullet = bullets[i];
        if(!bullet || bullet == 0 || !bullet.alive) continue;  
        
        const dist = ast.pos.copy().sub(bullet.pos);
        if(dist.mag() < ast.collision_rad) {
          ast.alive = 0;
          bullet.alive = 0;
          score += round(shot_points*ast.points_multiplier);
        }
      }
  }
  
  this.collision_self = function(ast, bullets){
    
      //Check ast against all bullets
      for(let i=0; i<this.asteriods.length; i++){
        const ast2 = this.asteriods[i];
        if( i == ast.array_index ) continue;
        if(!ast2 || ast2 == 0 || !ast2.alive) continue;  
        
        const dist = ast.pos.dist(ast2.pos);
        if(dist < ast.collision_rad*1.1) {
          const temp = ast.direction.copy().setMag(ast.direction.mag()*0.9);
          const temp2 = ast2.direction.copy().setMag(ast2.direction.mag()*0.9);
          ast.direction.set(temp2);
          ast2.direction.set(temp);
          
        }
      }
  }
  
}