// Works best with size=280 and stroke_weight=15
const canvas_size = 280;
const stroke_weight = 15;
const domain = 'http://localhost:4000';
const doodle_url =  domain+'/data';
const translation_url =  domain+'/translation';
const classifier = ml5.imageClassifier("DoodleNet", () => modelLoaded = true);
const img_name_default = "My-Drawing";
const grayscale = false;
const predict_interval = 5; //One Prediction in <number> frames when drawing

var modelLoaded;
var p5canvas;
var p5canvas_2;

var sketch_p5_1;
var sketch_p5_2;

var ml5_predictions;

var translation;

// ml5.imageClassifier("MobileNet");
function onModelReady() {
    // TODO
}

function ml5_gotResults(err, results) {
    if(err){
        $('body').append(err);
        return;
    }

    ml5_predictions = results;
    let html_id = '#ml5_DoodleNet';

    Translate_Data();

    $(html_id + ' div ').remove();
    $(html_id).append('<div></div>');
    results.forEach(element => {
        let conf = Math.round(element.confidence*100);
        $(html_id + ' div ').append('<li>'+element.label+'('+conf+'%)</li>')
    });
    
    //classifier.classify(p5canvas.canvas, gotResults);
    // all the amazing things you'll add
}

function Translate_Data(){
    for (let i = 0; i < ml5_predictions.length; i++) {
        ml5_predictions[i].label = translation[ml5_predictions[i].label];      
    }
}

// Handle Posts
function HTTP_Post_Data(){;
    let data = {
        img_data: p5canvas.canvas.toDataURL(),
        img_name: input_name[0].data,
        user: "Daniel",
        ml5_best_fit: ml5_predictions[0],
        ml5: ml5_predictions
    }

    if (!data.img_name || data.img_name.length === 0) data.img_name = img_name_default; 
    sketch_p5_2.httpPost(doodle_url, 'json', data, (result) => console.log(result)); 
}

function handleFile(file) {
  print(file);
  if (file.type === 'image') {
    img = $('body').append('<img src="'+file.data+'"></img>');
    //classifier.classify(img, (err, results) => gotResults(err, results, '#DoodleNet'));
    //classifier2.classify(img, (err, results) => gotResults(err, results, '#MobileNet'));
  } 
}



// P5 Canvases
var p5_2 = function (sketch) {
    
    
    sketch_p5_2 = sketch;

    // src => https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }

    sketch.makeCanvas = function () {
        p5canvas2 = sketch.createCanvas(canvas_size, canvas_size);
        p5canvas2.parent("p5_canvas_hidden"); 
        sketch.strokeWeight(stroke_weight);
        sketch.background(255); 
    }

    sketch.replicate = function(mX, mY, pmX, pmY) {
        sketch.line(mX, mY, pmX, pmY);
    }

    // Can be removed if canvas remains hidden
    sketch.setStroke = function(hex) {
        if(!grayscale) return;
        let rgb = hexToRgb(hex);
        let grey = ((rgb.r + rgb.g + rgb.b)/3)*0.75;
        sketch.stroke(grey);
    }
}

// P5.js Start
var p5_1 = function (sketch) {

    var sketch_p5_1 = sketch;
    let s = sketch;
    
    sketch.setup = function () {
    p5canvas = sketch.createCanvas(canvas_size, canvas_size);
    p5canvas.parent("p5_canvas");   

    sketch.background(255);
    sketch.strokeWeight(stroke_weight);

    clearBtn = sketch.createButton('clear');
    loadBtn = sketch.createButton('LoadImage');
    postBtn = sketch.createButton('PostData');
    downloadBtn = sketch.createButton('Download');
    
    clearBtn.parent("p5_canvas");
    loadBtn.parent("p5_canvas");
    postBtn.parent("p5_canvas");
    downloadBtn.parent("p5_canvas");

    clearBtn.mousePressed(() => {s.background(255); sketch_p5_2.background(255)});
    postBtn.mousePressed(HTTP_Post_Data);
    downloadBtn.mousePressed(() => s.saveCanvas(p5canvas, (!input_name[0].value ? img_name_default : input_name[0].value), 'jpg'));

    input_color = $('#input_color');
    input_weight =  $('#input_weight');
    input_name =  $('#input_name');
    input_color.on('change', () => { s.stroke(input_color[0].value); sketch_p5_2.setStroke(input_color[0].value) });
    input_weight.on('change', () => s.strokeWeight(input_weight[0].value))
    input_weight[0].value = stroke_weight;

    sketch_p5_2.makeCanvas();
  }
  
    s.draw = function () {
        if (s.mouseIsPressed) {
        s.line(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            sketch_p5_2.replicate(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            //deml_gotResults(doodleNet_classify(), "#DoodleNet");
            if(modelLoaded && s.frameCount % predict_interval === 0) classifier.classify(p5canvas2, ml5_gotResults);
        }
    }
}

//Initialize Sketches
new p5(p5_2);

sketch_p5_2.httpGet(translation_url, 'json', (data) => {
    new p5(p5_1);
    translation = data
});
/* REST Method Calls */
