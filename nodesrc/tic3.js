var gridsize = 5;
var gridTotal = 5*5;
var board;
var cells = [];

var game_over = false;
var winner = null;
var winner_cells = [];

var players = ['X', 'O'];
var curr_player = 0;

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
        let cell = { html: $('#tic-'+index), player: null }
        cells.push(cell);
        cell.html.mousedown(function(){
            if(game_over || cell.player !== null) return;
            //cell.html.append('<img src="assets/star.png"></img>');
            cell.html.append(players[curr_player]);
            cell.player = players[curr_player];
            curr_player = (curr_player === 0 ? 1 : 0);
            update_game();
        })
    }
}

function update_game() {
    
    CheckForWin();
    $('body').append(winner);
    if(game_over) {
        for (let index = 0; index < winner_cells.length; index++) {
            winner_cells[index].html.append("lol");
            
        }
    }
    return;
    if(winner_cells.length > 0) {
        for (let index = 0; index < winnder_cells.length; index++) {
            winnder_cells.html.html = "bla";       
        }
    }
}

function CheckForWin(){

    if(game_over) return;
    $('body').append("dd\n");
    //HOR
    for(row = 0; row<gridsize; row++){
        winner = cells[row*gridsize].player;
        if(winner === null) continue;
        game_over = true;

        for(col = 0; col<gridsize; col++) {
            let cell = cells[col + row*gridsize];
     
            if(cell.player === winner) winner_cells.push(cell);
            else {
                winner = null;
                winner_cells = [];
                game_over = false;
                break;
            }
        }   
    }

    if(game_over) return;

    //VERT
    for(col = 0; col<gridsize; col++){
        winner = cells[col].player;
        if (winner === null) continue;
        game_over = true;

        for(row = 0; row<gridsize; row++) {
            let cell = cells[col + row*gridsize];
            
            if(cells[row*gridsize + col].player === winner) winner_cells.push(cells[row*gridsize + col]);
            else {
                winner = null;
                winner_cells = [];
                game_over = false;
                break;
            }
        }   
    }

    if(game_over) return;
    
    //DIA linksOben - rechtsUnten
    winner = cells[0].player;
    winner_cells = [];
    if(winner !== null) {
        game_over = true;     
        for(i = 0; i<gridsize; i++){
            let cell = cells[i*gridsize + i];

            if(cell.player === winner) winner_cells.push(cell); 
            else {
                winner = null;
                winner_cells = [];
                game_over = false;
                break;
            }
        }
    }
        
    if(game_over) return;

    //DIA linksOben - rechtsUnten
    winner = cells[gridsize-1].player;
    if(winner !== null) {
        game_over = true;     
        for(i = 0; i<gridsize; i++){
            let cell = cells[i*gridsize + (4-i)];

            if(cell.player === winner) winner_cells.push(cell); 
            else {
                winner = null;
                winner_cells = [];
                game_over = false;
                break;
            }
        }
    }

  }
  

var cells = [];

function cell(div){
    this.div
   
}

