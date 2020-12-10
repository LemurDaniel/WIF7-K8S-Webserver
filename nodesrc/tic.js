
let canvX = 1000; //size of grid
let canvY = canvX; 
let distance = 55; // distance to canvas border
let gridSize = 5; // Cell Count

let lineThick1 = 15
let lineThick2 = 45

let framerate = 60;

let boolRand = 0;

let size = (canvX - ((gridSize+1)*distance)) / gridSize;
let xOff = (size / 2) + distance;
let yOff = (size / 2) + distance;

let grid = new Array(gridSize);
let validPos = new Set();


let currentPlayer = 0;
let players = ['X', 'O', ];
let drawFuncs = [drawPl1, drawPl2];  // Function to Draw each Player

function drawPl1(i, j){
  sX = distance + j*(size+distance);
  sY = distance + i*(size+distance);
  line(sX, sY, sX+size, sY+size);
  line(sX, sY+size, sX+size, sY);
}

function drawPl2(i, j){
  ellipse(xOff+ j*(size+distance), yOff+ i*(size+distance) ,size);
}

function drawPl3(i, j){
  drawPl2(i, j);
  drawPl1(i,j);
}


let winner = ' ';
let winnerIndex1;
let gameEnd;

function setup() {
  createCanvas(canvX, canvY);
  gameEnd = false;
  winner = ' ';
  for(i = 0; i<gridSize; i++){
    grid[i] = new Array(gridSize);
    for(j = 0; j<gridSize; j++)  {
      grid[i][j] = ' ';
      validPos.add(i*gridSize+j);
    }
  }
  draw();
}

function findCell(){
  // Quadratic: 1000px
  let dist = distance + lineThick1;
  if(mouseX > canvX - dist || mouseX < dist) return;
  if(mouseY > canvY - dist || mouseY < dist) return;

  let actX = mouseX - dist;
  let actY = mouseY - dist;
  let actSize = canvX - lineThick1*(gridSize + 1);
  let cellWidth = actSize / gridSize;
  print(cellWidth);
  actX = mouseX - ((mouseX / cellWidth)+1)*lineThick1;
  print(actX / cellWidth);
}

function mouseClicked() {
  findCell();
  if (!gameEnd) return;
  setup();
}

function draw() {
  background(120);
  frameRate(framerate);
  
  drawGame();

  if(winner != ' ') {
    frameRate(0);
    print("The Winner is Player: "+winner);
    let point1 = winnerIndex[0];
    let point2 = winnerIndex[1];
    stroke(255);
    strokeWeight(lineThick2);
    line(xOff+ point1[1]*(size+distance), yOff+ point1[0]*(size+distance), xOff+ point2[1]*(size+distance), yOff+ point2[0]*(size+distance));
    drawGame();
    
  }else if(validPos.size == 0) {
    print("It's a TIE");
    gameEnd = true;
    frameRate(0);
  }
  else {
      RandomTurn();
      frameRate(0);
      CheckForWin();
  }  
 
}

function drawGame(){
  stroke(0);
  strokeWeight(lineThick1);
  noFill();
  for(i = 0; i<grid.length; i++){
    for(j = 0; j<grid.length; j++){
      for(k=0; k<players.length; k++) if(players[k] == grid[i][j]) drawFuncs[k](i, j);
    }
  }
  
  for(i = 0; i<=grid.length; i++){
  let xline = (size+distance)*i +distance/2;
  line(distance*0.5, xline, canvX-distance*0.5, xline);
  line(xline, distance*0.5, xline, canvY-distance*0.5);
  }  
  
}

function CheckForWin(){
  //HOR
  if(winner == ' '){
      for(i = 0; i<grid.length; i++){
        winner = grid[i][0];
        for(j = 0; j<grid.length; j++)  if(grid[i][j] != winner) winner = ' ';
        if(winner != ' ') {
          winnerIndex = [ [i, 0], [i, gridSize-1] ];
          break;
        }
      }
  }
  
  //VERT
  if(winner == ' '){
      for(i = 0; i<grid.length; i++){
        winner = grid[0][i];
        for(j = 0; j<grid.length; j++)  if(grid[j][i] != winner) winner = ' ';
        if(winner != ' ') {
          winnerIndex = [ [0, i], [gridSize-1, i] ];
          break;
        }
      }
  }
  
  //DIA
  if(winner == ' '){
      winner = grid[0][0];
      let winner2 = grid[0][gridSize];
    
      for(i = 0; i<grid.length; i++){
          if(grid[i][i] != winner) winner = ' ';
          if(grid[i][i] != winner2) winner2 = ' ';       
      }
      if(winner2 != ' ') {
          winner = winner2;
          winnerIndex = [ [0, gridSize-1], [gridSize-1, 0] ];       
      }
      else if(winner != ' ') {
          winnerIndex = [ [0, 0], [gridSize-1, gridSize-1] ];
      }
  }
  
  gameEnd = winner != ' ';
}


function RandomTurn(){
  let rand = boolRand == 0 ? int(Math.random()*validPos.size)+1 : Math.min(boolRand, validPos.size);
  let val;
  
  let it = validPos.values();
  while(rand--)  val = it.next().value;
  
  TakeTurn(int(val/gridSize), val%gridSize);
}

function TakeTurn(pY, pX){
  let pos = pY*gridSize+pX;
    if(!validPos.has(pos)) return;
    validPos.delete(pos);
    grid[pY][pX] = players[currentPlayer];
    currentPlayer = (currentPlayer + 1) % players.length;
  
}


  
  
  