var gridsize = 5;
var gridTotal = 5*5;
var board;

function setup() {
    board = $('#div_game');
    let content = '';
    for (let index = 1; index < gridTotal; index++) {
        content += '<div id="'+ index +'"></div>';
        if(index % gridsize === 0) {
            board.append('<div class="flex-container">'+ content +'</div>');
            content = '';
        }
    }
}

var cells = [];

function cell(div){
    this.div
   
}

