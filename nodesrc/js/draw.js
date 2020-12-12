var classifier;
var classifier2;
var p5canvas;

var ml5_predictions;

// ml5.imageClassifier("MobileNet");
function onModelReady() {
    classifyButton = createButton('Classify');
    classifyButton.parent("p5_canvas");
    classifyButton.mousePressed(() => {
        deml_gotResults(doodleNet_classify(), "#DoodleNet");
        classifier.classify(p5canvas, ml5_gotResults);
    });
}

function deml_gotResults(results){
    let html_id = '#demo_DoodleNet';
    $(html_id + ' div ').remove();
    $(html_id).append('<div>'+results+'</div>');
}

function ml5_gotResults(err, results) {
    if(err){
        $('body').append(err);
        return;
    }

    ml5_predictions = results;
    let html_id = '#ml5_DoodleNet';

    $(html_id + ' div ').remove();
    $(html_id).append('<div></div>');
    results.forEach(element => {
        $(html_id + ' div ').append('<li>'+element.label+'</li>')
    });
    
    //classifier.classify(p5canvas.canvas, gotResults);
    // all the amazing things you'll add
}

// P5.js Start
function setup() {
    p5canvas = createCanvas(280, 280);
    p5canvas.parent("p5_canvas");   
    background(255);

    clearButton = createButton('clear');
    loadButton = createButton('LoadImage');
    postButton = createButton('PostData');
    
    clearButton.parent("p5_canvas");
    loadButton.parent("p5_canvas");
    postButton.parent("p5_canvas");

    clearButton.mousePressed(() => background(255));
    postButton.mousePressed(HTTP_Post_Data);


    loadModel_DoodleNet();
    classifier = ml5.imageClassifier("DoodleNet", onModelReady);
    //classifier2 = ml5.imageClassifier("MobileNet");

    //input = createFileInput(handleFile);
    //input.position(0, 0);

    //setupREST();
    console.log("aaa");
  }

function HTTP_Post_Data(){
    let url = 'http://localhost:4000/data';
    let data = {
        img_data: p5canvas.canvas.toDataURL(),
        user: "Daniel",
        ml5: ml5_predictions,
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
