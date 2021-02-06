url_save = window.location.origin+'/space/score';

var canvas_loaded = 0;
var ship;
var asteroids;
var collided_ast;
var gamestate;
var score;

const shot_points = 20;
const surviving_points = 1; // per second

const size = 800;
const scale_factor = 0.8;


function setup() {
  if(gamestate && gamestate == 'RUNNING') return;
  if(!canvas_loaded) {
    canvas = createCanvas(size*scale_factor, size*scale_factor);
    canvas.parent('#div_game');
    document.querySelector('#restart').addEventListener('click', () => setup() );
    canvas_loaded = true;
  }
  delete ship;
  delete asteroids;

  ship = new Ship(size/2, size/2, radians(-90));
  asteroids = new Asteriods(50);
  gamestate = 'RUNNING';
  score = 0;

  document.querySelector('#restart').classList.add('hidden');

  frameRate(60);
}

function draw() {
  if(frameCount % 60 == 0)  score += surviving_points;
  
  background(0);
  scale(scale_factor);
  
  ship.draw();
  ship.move();
  
  //Draw Highscore
  push();
  translate( 16, 32);
  textSize(32);
  fill(255, 255, 255);
  textAlign(LEFT, CENTER);
  text('Score: ' + score + ' Points', 0, 0);
  pop();
  
  //Draw all asteroids
  if(gamestate == 'RUNNING') asteroids.draw();
  else if(gamestate == 'END') {
    // Draw asteroid with which collided // doesn't work sometimes
    asteroids.draw(collided_ast);
 
    // Draw Gameover Text
    push();
    translate(size/2, size/2);
    textSize(64);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    text('Game Over', 0, 0);
    pop();

    // post score to server
    httpPost(url_save, 'json',  { score: score }, (result) => { });
    document.querySelector('#restart').classList.remove('hidden');
    
    //Pause game
    frameRate(0);

    gamestate == 'PRESTART';
  }
}

// Check if vector OutOfBounds
function vectorOOB(vec, treshold) {
  if(vec.x < 0-treshold || vec.x > size+treshold ) return true;
  if(vec.y < 0-treshold || vec.y > size+treshold ) return true;
  return false;
}


// Ship
function Ship(x, y, angle) {
  
  this.angle = angle;
  this.steer_angle = 0.05;
  
  this.vectorV = createVector(0,0);
  this.friction = 0.05;
  this.maxV = 10;
  
  this.pos = createVector(x,y);
  this.magnitude = 5;
  

  this.move = function () {
  
    // Steer left and right
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65) ) this.angle -= this.steer_angle;
    else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) ) this.angle += this.steer_angle;
    
    // Thrust and shoot
    keyPressed = () => {
      if(keyCode == UP_ARROW || keyCode == 87)
        this.vectorV.add(p5.Vector.fromAngle(this.angle, this.magnitude));
     if(keyCode == 32)
       this.cannon.shoot(this.pos.copy(), p5.Vector.fromAngle(this.angle, 2));
    }
    
    // limit Velocity to max Velocity
    this.vectorV.limit(this.maxV);
      
    // reduce velocity by friction // add/subtract for negative/positive velocity
    this.vectorV.x += -this.friction * Math.sign(this.vectorV.x);
    this.vectorV.y += -this.friction * Math.sign(this.vectorV.y);
      
    // if velocity is nearly zero then set it to zero
    if(abs(this.vectorV.x) < 0.05 ) this.vectorV.x = 0; 
    if(abs(this.vectorV.y) < 0.05 ) this.vectorV.y = 0; 
       
    // Add velocity vector to current position vector ==> move by velocity
    this.pos.add(this.vectorV);
    
    // Handle position to wrap edges of canvas
    this.pos.rem(createVector(size, size));
    if(this.pos.x < 0) this.pos.x = size;
    if(this.pos.y < 0) this.pos.y = size;
  }
  
  // The cannon object
  this.cannon = {
    
    speed: 15,
    bullets: [],
    
    // Generate bullet with position vector and velocity vector (direction)
    shoot: function(pos, direction) { 
      this.bullets.push({ pos: pos, direction: direction.setMag(this.speed), alive: 1} ) },
    
    
    drawBullets: function(){

      for(let i=0; i <this.bullets.length; i++){
        const bullet = this.bullets[i];
        
        // skip invalid entries and dead bullets
        if(!bullet || bullet == 0 || !bullet.alive) continue; 
        
        push();    
        translate(bullet.pos);
        rotate(bullet.direction.heading() - radians(90));
        rect(-2 , 10, 5,20);
        pop();
        
        // move bullet by velocity vector
        bullet.pos.add(bullet.direction);
        // if bullet leaves screen, mark it as dead
        if(vectorOOB(bullet.pos, 0)) bullet.alive = 0; 
      }
       // remove dead bullets from array, every 60th frame
       if(frameCount%60 == 0) this.bullets = this.bullets.filter( (bullet) =>  bullet.alive );
    }
  }
  
  // draw spaceship
  this.draw = function(){
  
    push();
    
    noFill();
    strokeWeight(2);
    stroke(255 );
    
    translate(this.pos); 
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
  this.ast_count = 5;
  this.freeSpaces = new Buffer(amount); // stores free indexes in asteriods[]
  
  // Max/Min velocity of asteroids
  this.dmmax = 1.5;
  this.dmmin = 0.5;

  // enter all indexes of empty asteroids[]
  for(let i=0; i<this.ast_count; i++) { this.freeSpaces.push(i); }
  
  // Create an asteroid
  this.createAsteroids = function() {

    const vectors = [];
    const radius = random(15, 35);
    for(let angle=0; angle <TWO_PI; angle += TWO_PI/16){
      const rand = random(0.8, 1.2)
      const x =  rand * radius * cos(angle);
      const y = rand * radius * sin(angle);
      vectors.push(createVector(x, y))
    }
     
    // create vector at center of screen
    const pos = createVector(size/2, size/2);
    // move it at an random angle outside of screen
    const rand_vec = p5.Vector.fromAngle(random(0, TWO_PI));
    let mag = size / 2;
    while( !vectorOOB(p5.Vector.add(pos, rand_vec), radius) ) 
      rand_vec.setMag(mag++);
    pos.add(rand_vec);

    // create a velocity vector, that points directly at the current position of the ship
    const vector_to_ship = p5.Vector.sub(ship.pos, pos);
    
    // slightly change the previous velocity vetor by an angle, so that all asteriods
    // fly generally into the direction around the ship
    const direction = p5.Vector.fromAngle(vector_to_ship.heading()+ radians(random(-5, 5)) );

    // create an asteroid object
    ast = {
      pos: pos,
      direction: direction.setMag(random(this.dmmin, this.dmmax)),
      angle: 0,

      mass: radius*radius*PI,
      collision_rad: radius, // collision radius from origin of asteroid
      vectors: vectors, // offset for drawn vertices

      array_index: this.freeSpaces.pop(), // current index in asteriods[] array
      alive: 1,  // if dead ==> no collision checking
      garbage: 0, // if gargabe ==> asteroid doesn't get drawn and have free index in array to be replaced by newly spawned asteroid
  
      // for blinking animation
      state: 0,
      blinks: 10,
      wait: 10,
      wait_amount: 10,
      
      applyForce: function(force){
        this.direction.add(force.div(this.mass));
      }
    }
    
    // add newly created asteroid to asteriods[] array
    this.asteriods[ast.array_index] = ast;
  }
  

  // draw asteroids
  this.draw = function(index) {
    
      
      for(let i=0; i <this.asteriods.length; i++){
        if(index && i != index) continue; // if index is received, only draw specifed asteroid
        
        const ast = this.asteriods[i];
        // skip invalid entries and asteroids marked as garbage
        if(!ast || ast == 0 || ast.garbage) continue;
        
        // check for collision between current asteroid and all bullets
        this.collision_check(ast, ship.cannon.bullets);
        // check for collision between current asteroid and all other asteroids
        this.collision_self(ast);
        
        // check for collision with spaceship 
        // (as long as spaceship is InBounds and asteroid is alive)
        // ast.pos.dist(ship.pos) calculates distance of ship and asteroid
        // if that is smaller than the asteroids collision radius then ship is collided
        if(!vectorOOB(ast.pos) && ast.alive && ast.pos.dist(ship.pos) < ast.collision_rad) {  
          gamestate = 'END'; // when collided with ship
          collided_ast = ast.array_index; // store index of collided asteroid
        }
        
        push();   
        translate(ast.pos);
        rotate(ast.angle);
        
        noFill();
        stroke(255);
        strokeWeight(4);
        let v = ast.vectors;
        if(!ast.alive) this.die_anim(ast);
        
        beginShape();
        ast.vectors.forEach(vec => vertex(vec.x, vec.y));
        endShape(CLOSE);
        
         //draw collision Bounds // for testing
        //circle(0,0, ast.collision_rad) 
        pop();
    
        
        // move position of asteroid by adding velocity to position vector
        ast.pos.add(ast.direction);
        ast.angle += ast.direction.heading()*0.005;

        // teleport asteroids to other side of screen, when moved OutOfBound
        const m = 10;
        if(ast.pos.x < -ast.collision_rad-m) ast.pos.x = size+ast.collision_rad+m;
        if(ast.pos.y < -ast.collision_rad-m) ast.pos.y = size+ast.collision_rad+m;
        if(ast.pos.x > size+ast.collision_rad+m) ast.pos.x = -ast.collision_rad-m;
        if(ast.pos.y > size+ast.collision_rad+m) ast.pos.y = -ast.collision_rad-m;
      }
    
      // increase maximum asteroids with icreasing score
      if(this.ast_count < this.amount && score > this.ast_count * 200) {
        this.freeSpaces.push(++this.ast_count); 
      }

      // Check if their are freeSpaces in array and create a new asteroid every second
      // only create a new one every second, so that not all new ones get created instantly
      if(!this.freeSpaces.isEmpty() && frameCount % 60 == 0) 
        this.createAsteroids();
  }
  
  // take care of blinking and hiding dead asteroids
  this.die_anim = function(ast) {
    if(ast.state == 0) noStroke(); // state = 0 is hidden
    else stroke(255); // state = 1 is drawn
    
    if(ast.wait-- >= 0) return; // wait certain number of frames before changing state
    
    ast.state = (ast.state+1)%2; // switch state between 1 and 0
    
    ast.wait = ast.wait_amount; // refresh wait timer
    ast.wait_amount--; // decrease overall wait time ==> progressing shorter blinking
    ast.blinks--; // decrease by one blink performed
    
    // if asteroid blinked a certain number of times, mark it as garbage
    // and push its index to the freeSpaces to be ovridden by a new one
    if(ast.blinks == 0) {
      ast.garbage = 1;
      this.freeSpaces.push(ast.array_index);
    }
  }
  
  // check for collsion with bullets
  this.collision_check = function(ast, bullets) {

      // if ast is dead then perform no collision checks
      if(!ast.alive) return;
      
      //Check ast against all bullets
      for(let i=0; i<bullets.length; i++){
        const bullet = bullets[i];
        // skip invalid entries and dead bullets
        if(!bullet || bullet == 0 || !bullet.alive) continue;  
        
        // calculate distance between current bullet and asteroid
        // if distance is smaller than collision radius of asteroid then bullet has colided
        const dist = ast.pos.dist(bullet.pos);
        if(dist < ast.collision_rad) {
          // mark asteroid an bullet as dead and increase highscore
          ast.alive = 0;
          bullet.alive = 0;
          score += round(shot_points*ast.collision_rad*0.15);
        }
      }
  }
  
  // Check for collision with other asteroids
  this.collision_self = function(ast, bullets){
    
    if(!ast.alive) return;
  
    // check against all other asteroids
    for(let i=0; i<this.asteriods.length; i++){
      const ast2 = this.asteriods[i];
      
      // skip invalid entries, dead asteroids and collision testing of asteroid against itself
      if( i == ast.array_index ) continue; 
      if(!ast2 || ast2 == 0 || !ast2.alive) continue;  
      
      // if distance is smaller thant collision radius then asteroids have collided
      if(ast.pos.dist(ast2.pos) < ast.collision_rad + ast2.collision_rad) {
        const temp = ast.direction.copy();
        const temp2 = ast2.direction.copy();
        ast.direction.set(0);
        ast2.direction.set(0)
        ast.applyForce( temp2.mult(ast2.mass).mult(0.9) );
        ast2.applyForce( temp.mult(ast.mass).mult(0.9) );
        
        //move by one frame
        ast2.pos.add(ast2.direction);
        ast.pos.add(ast.direction);
        
        // if still colliding create two vectors opposite to each other
        if(ast.pos.dist(ast2.pos) < ast.collision_rad + ast2.collision_rad) {
          ast.direction = p5.Vector.random2D().setMag(random(this.dmmin, this.dmmax));
          ast2.direction = ast.direction.copy().mult(-1);
        }
          
      }
    }
  }
  
}
