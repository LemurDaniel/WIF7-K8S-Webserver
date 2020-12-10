

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
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var background;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('rocket', 'assets/rocket.png',);
    this.load.image('segment1', 'assets/segment1.jpg');
    this.load.image('segment2', 'assets/segment2.jpg');
    this.load.image('segment3', 'assets/segment3.jpg');
}

function create ()
{
    //  A simple background for our game --4700 - 4100  - 6800
    background = this.add.image(0, -5770, 'segment1');
  
  
   

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();
    bombs = this.physics.add.group();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    let count = config.width / 400;
   // for (let index = 0; index <= 0; index++) {
    //  platforms.create(400*index, config.height, 'ground');
    //}

    

    // The player and its settings
    //var player2 = this.physics.add.sprite(config.width/2, config.height-42, 'rocket');

    player = this.physics.add.sprite(config.width/2, config.height-72, 'rocket');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);



    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#ffffff' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    //this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
   // this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    //anims
    
}

var launched = false;
var flying = false;

function update ()
{
    if (gameOver)
    {
        return;
    }
    //background.y += 20;
    scoreText.setText('Score: ' + background.y);
    if (cursors.up.isDown && !launched) {
      player.setVelocityY(50);
      launched = true;
    }
    if (launched) {
        if(player.y > 300 ) {
          player.setVelocityY(player.body.velocity.y * 1.05);
        }
        else if (!flying){
          player.setVelocityY(0);
          flying = true;
        }
    } 
    
    if(flying) {
      background.y += 10; // 4100 - 6800
      if(background.y > 7000) background.y = 4100;
    }

}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    //scoreText.setText('Score: ' + score);

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
