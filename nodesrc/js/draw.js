var classifier;
var classifier2;
var p5canvas;

// ml5.imageClassifier("MobileNet");
function onModelReady() {
    classifyButton = createButton('Classify');
    classifyButton.mousePressed(() => {
      classifier.classify(p5canvas, (err, results) => gotResults(err,     results, '#DoodleNet'));
    });
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


// P5.js Start
function setup() {
    p5canvas = createCanvas(400, 400);
    clearButton = createButton('clear');
    loadButton = createButton('LoadImage');
    clearButton.mousePressed(() => background(255));

    //classifier = ml5.imageClassifier("DoodleNet", onModelReady);
    //classifier2 = ml5.imageClassifier("MobileNet");

    //input = createFileInput(handleFile);
    //input.position(0, 0);

    //setupREST();
    post = createButton('PostData');
    post.mousePressed(HTTP_Post_Data);
    console.log("aaa");
  }

function HTTP_Post_Data(){
    let url = 'http://localhost:4000/data';
    let data = {
        img_data = p5canvas.canvas.toDataURL(),
        user: "Daniel",
        ml5: "testing",
        other_ml5: "testing | testing | testing"
    }
    httpPost(url, 'json', data, (result) => console.log(result)); 
}

function handleFile(file) {
  print(file);
  if (file.type === 'image') {
    img = $('body').append('<img src="'+file.data+'"></img>');
    //classifier.classify(img, (err, results) => gotResults(err, results, '#DoodleNet'));
    //classifier2.classify(img, (err, results) => gotResults(err, results, '#MobileNet'));
  } 
}
  
function draw() {
    if (mouseIsPressed) {
      strokeWeight(8);
      line(mouseX, mouseY, pmouseX, pmouseY);
    }
}






/* REST Method Calls */
