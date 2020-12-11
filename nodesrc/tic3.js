var gridsize = 5;
var gridTotal = 5*5;
var board;
var cells = [];

var players = ['X', 'O'];
var player = 0;

function setup() {
    board = $('#div_game');
    let content = '<table><tr>';
    for (let index = 1; index <= gridTotal; index++) {
        content += '<th><div id="tic-'+ index +'"></div></th>';
        if(index % gridsize == 0) content += '</tr>' + (index < gridTotal ? '<tr>':'');
    }
    content += '</table>';
    board.append(content);

    for (let index = 1; index <= gridTotal; index++) {
        let cell = { html: $('#tic-'+index), player: ' ' }
        cells.push(cell);
        cell.html.mousedown(function(){
            if(cell.player !== ' ') return;
            cell.html.append('<img src="assets/star.png"></img>');
            cell.player = players[player];
        })
    }
}

var cells = [];

function cell(div){
    this.div
   
}

