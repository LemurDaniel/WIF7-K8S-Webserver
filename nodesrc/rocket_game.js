

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
var weapon;

var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var heightText;

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
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('rocket', 'assets/rocket.png', { frameWidth: 57, frameHeight: 120 });
    this.load.image('segment1', 'assets/segment1.jpg');
    this.load.image('segment2', 'assets/segment2.jpg');
    this.load.image('segment3', 'assets/segment3.jpg');
}

function create ()
{
    //  A simple background for our game --4700 - 4100  - 6800
    background = this.add.image(0, -5770, 'segment1');
   
    bombs = this.physics.add.group();
    stars = this.physics.add.group();

    player = this.physics.add.sprite(config.width/2, config.height, 'rocket', 0);
    player.body.allowGravity = false
    //weapon = game.add.weapon;

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.01);
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    scoreText = this.add.text(16, 16, 'Score:  ' + score + ' Points', { fontSize: '32px', fill: '#ffffff' });
    heightText = this.add.text(16, 48, 'Height: 0 Km', { fontSize: '32px', fill: '#ffffff' });
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    //anims
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
    //generateStars(1);
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


  //if(Phaser.Math.Between(0, 200) == 50) generateStars(1);
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
    
    return;
    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    //player.anims.play('turn');

    gameOver = true;
}
