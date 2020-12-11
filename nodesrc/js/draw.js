var classifier;
var classifier2;

// ml5.imageClassifier("MobileNet");
function setup() {
    //google = google.load("language", "1");
    classifier = ml5.imageClassifier("DoodleNet");
    classifier2 = ml5.imageClassifier("MobileNet");
    canvas = createCanvas(400, 400);
    clearButton = createButton('clear');
    classifyButton = createButton('Classify');
    loadButton = createButton('LoadImage');
    clearButton.mousePressed(clearCanvas);
    classifyButton.mousePressed(() => classifyImg(canvas));
    background(255);

    input = createFileInput(handleFile);
    input.position(0, 0);

    //setupREST();
  }

function handleFile(file) {
  print(file);
  if (file.type === 'image') {
    img = $('body').append('<img src="'+file.data+'"></img>');
    classifier.classify(img, (err, results) => gotResults(err, results, '#DoodleNet'));
    classifier2.classify(img, (err, results) => gotResults(err, results, '#MobileNet'));
  } 
}

function classifyImg() {
    $('body').append("Test");
    classifier.classify(canvas, (err, results) => gotResults(err, results, '#DoodleNet'));
    classifier2.classify(canvas, (err, results) => gotResults(err, results, '#MobileNet'));
}

function clearCanvas() {
    background(255);
}

function gotResults(err, results, html_id) {
    if(err){
        $('body').append(err);
        return;
    }

    results.forEach(element => {
        $(html_id).append('<li>'+element.label+'</li>')
    });
    
    // all the amazing things you'll add
}


  
function draw() {
    if (mouseIsPressed) {
      strokeWeight(8);
      line(mouseX, mouseY, pmouseX, pmouseY);
    }
}






/* REST Method Calls */
function setupREST(){
    const url = 'localhost:3000/data';

    $('#test').on('click', function(){
        $('body').append('babababakkk')
        $post(url, data);
    })
}