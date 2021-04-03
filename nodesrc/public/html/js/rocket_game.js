//    Based on this free Tutorial: https://phaser.io/tutorials/making-your-first-phaser-3-game/part1
//    Rocket-sprite: https://www.kindpng.com/imgv/hwimxwh_cartoon-rocket-png-cartoon-transparent-transparent-background-rocket/
//    Not Finished

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'div_game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var cursors;

var score = 0;
var scoreText;
var heightText;
var gameOver = false;

var background;

var height = 0;
var temp = 80;
var speed = 10;

var pointsPerStar = 100;
var pointsPerKm = 1;
var KmPerPoint = 25;

var chanceOfStar = 150;
var starChances = [ 5, 25, 100, 200, 255 ];
var starSizes = [3, 2, 1.5, 1, 0.8 ];


var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('star', 'assets/game/star.png');
    this.load.spritesheet('rocket', 'assets/game/rocket.png', { frameWidth: 57, frameHeight: 120 });
    this.load.image('background', 'assets/game/background.jpg');
}

function create ()
{
    //  --4700 - 4100  - 6800
    background = this.add.image(0, -5770, 'background');
   
    stars = this.physics.add.group();
    player = this.physics.add.sprite(config.width/2, config.height, 'rocket', 0);
    player.body.allowGravity = false
    player.setCollideWorldBounds(true);
    player.setBounce(0.01);

    this.physics.add.overlap(player, stars, collectStar, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    scoreText = this.add.text(16, 16, 'Score:  ' + score + ' Points', { fontSize: '32px', fill: '#ffffff' });
    heightText = this.add.text(16, 48, 'Height: 0 Km', { fontSize: '32px', fill: '#ffffff' });


    this.anims.create({
      key: 'launch',
      frames: this.anims.generateFrameNumbers('rocket', { start: 0, end: 1 }),
      frameRate: 15,
      repeat: 6
    });
}

var isLaunched = false;
var isFlying = false;

function update(){
  if(isFlying) flying();
  else ground();
}

function ground ()
{
    if (cursors.up.isDown && !isLaunched) {
      player.setVelocityY(300);
      player.anims.play('launch', true);
      isLaunched = true;
    }
    if (isLaunched) {
        if(player.y > 300 ) {
          player.setVelocityY(player.body.velocity.y * 1.03);
        }
        else {
          player.setVelocityY(0);
          isFlying = true;
        }
    } 
}

function flying () {
  background.y += speed; // 4100 - 6800
  if(temp > 10 && background.y % 100 == 0) temp -= 5;
  if(background.y % temp == 0) height += 1;
  if(background.y > 7000) background.y = 4100;


  if(cursors.left.isDown) player.x -= 3;
  if(cursors.right.isDown) player.x += 3;

  if(cursors.up.isDown && player.y > 200) player.y -= 1;
  if(height > 400 && player.y < 500) {
      if(!cursors.up.isDown) player.y += 0.75;
      if(cursors.down.isDown) player.y += 1; 
  }

  if(height >= 0 && Phaser.Math.Between(0, chanceOfStar) == chanceOfStar) generateStars(1);

  if(height % KmPerPoint == 0) score += pointsPerKm;
  heightText.setText('Height: ' + height + ' km');
  scoreText.setText('Score:  ' + score + ' Points');

}

function generateStars(count){
  for (let index = 0; index < count; index++) {
    let star = stars.create(Phaser.Math.FloatBetween(25, config.width-25), 0, 'star');
    star.setVelocityY(Phaser.Math.FloatBetween(120, 240));
    if(star.x > config.width/3) star.setVelocityX(Phaser.Math.FloatBetween(-120, 10));
    else star.setVelocityX(Phaser.Math.FloatBetween(10, 120));

    
    let random = Phaser.Math.Between(0,starChances[starChances.length-1]);
    for (let index2 = 0; index2 < starChances.length; index2++) {
      if(random > starChances[index2]) continue;
      star.setScale(starSizes[index2]).refreshBody();
      star.scaleInfo = starSizes[index2];
      break;
    }

  }
}

function collectStar (player, star)
{
    star.disableBody(true, true);
    score += (pointsPerStar * star.scaleInfo);
}
