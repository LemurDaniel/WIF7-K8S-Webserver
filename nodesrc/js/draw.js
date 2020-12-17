// Works best with size=280 and stroke_weight=15
const canvas_size = 280;
const stroke_weight = 15;

const FRAME_RATE = 60;
const FRAME_RATE_SHOWCASE = 20;

const img_name_default = "My-Drawing";
const grayscale = false;
const predict_interval = 10; //One Prediction in <number> frames when drawing

const domain = window.location.href;
const url_save =  domain+'/images/save';
const url_search = domain+'/images/search';
const translation_url =  domain+'translation';

//const classifier_model = "DarkNet-tiny";
//const classifier_model = "Darknet-reference";
//const classifier_model = "MobileNet";
const classifier_model = "DoodleNet";
const classifier = ml5.imageClassifier(classifier_model, () => modelLoaded = true);

var modelLoaded;
var p5canvas;
var p5canvas2;

var p5_1;
var p5_2;
var p5_2;

var ml5_predictions;
var server_path = '';

var translation;


// ML5 Functions
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
        $(html_id + ' div ').append('<li>('+conf+'%) '+element.label+'</li>');
    });
    
}

function Translate_Data(){
    if(!translation) return;
    for (let i = 0; i < ml5_predictions.length; i++) {
        ml5_predictions[i].label = translation[ml5_predictions[i].label];      
    }
}



/*  P5 HIDDEN CANVA
    ML5-DoodleNet is trained with black and white images and doesn't really take color into account.
    Additionally, if the color gets to bright DoodleNet can't distinguish the Doodle from the white Background.

    To still support colored doodles, the browser creates two canvases.
    One with color wich the user can see and second hidden one,
    which draws the same picture parallel with only a black stroke.
*/
p5_2 = function (sketch) {

    // src => https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }

    sketch.setup = function () {
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
        //if(!grayscale) return;
        let rgb = hexToRgb(hex);
        //let grey = ((rgb.r + rgb.g + rgb.b)/3)*0.75;
        let trsh = 250; //treshold
        console.log(rgb);
        if(rgb.r >= trsh && rgb.g >= trsh && rgb.b >= trsh) sketch.stroke(255);
        else sketch.stroke(0);
        //sketch.stroke(grey);
    }
}


 // Define input elements
 var input_weight;
 var clearBtn;
 var downloadBtn;
 var uploadBtn;
 var postBtn;
 var input_color;
 var input_name;
 var input_file;

// P5 MAIN CANVAS
p5_1 = function (sketch) {
    // Showcase for strokesize and color
    let showcase = function(sketch){

        let sh_size = 35;
       
        sketch.setup = function(){
            sketch.createCanvas(sh_size, sh_size).parent("weight_showcase"); 
            sketch.background(255); 
            sketch.fill(255);
            sketch.noStroke();
            sketch.frameRate(0);

            input_weight[0].value = stroke_weight;
            input_weight.on('mousedown', () => sketch.frameRate(FRAME_RATE_SHOWCASE));
            input_weight.on('mouseleave', () => sketch.frameRate(0));                
            input_weight.on('change', () => {
                const val = input_weight[0].value;
                p5_1.strokeWeight(val); 
                p5_2.strokeWeight(val);
                sketch.draw();
            })

            input_color.on("click", () => sketch.frameRate(FRAME_RATE_SHOWCASE));
            input_color.on('change', () => { 
                p5_1.stroke(input_color[0].value); 
                p5_2.setStroke(input_color[0].value);
                sketch.frameRate(0)
            });
      

            sketch.draw();
        }

        sketch.draw = function(){
            // Set size relative to strokesize
            sketch.background(255);
            sketch.fill(input_color[0].value);
            // maps range(1,25) to (1, showcasesize) || 25 is maxval of slider
            const size = s.map(input_weight[0].value, input_weight[0].min, input_weight[0].max, 2, sh_size-5);
            sketch.circle(sh_size/2, sh_size/2, size);
            console.log(true)
        }
    }
    // showcase END


    // Actual Canvas
    let s = sketch;
    
    sketch.setup = function () {

        // Define input elements
        input_color = $('#input_color');
        input_weight =  $('#input_weight');
        clearBtn = $('#btn_clear');
        downloadBtn = $('#btn_download');
        uploadBtn = $('#btn_upload');
        postBtn = $('#btn_post');
        input_name =  $('#input_name');

        // Initialize showcase
        p5_3 = new p5(showcase);
        // Create hiddencanvas
        p5_2 = new p5(p5_2);
        p5_2.frameRate(FRAME_RATE);
        sketch.frameRate(FRAME_RATE);
   
        // Create main canvas
        p5canvas = sketch.createCanvas(canvas_size, canvas_size);
        p5canvas.parent("p5_canvas");   
        sketch.background(255);
        sketch.strokeWeight(stroke_weight);

    
        // Button Functionality
        clearBtn.on('click', () => {s.background(255); p5_2.background(255)});
        postBtn.on('click', () => HTTP_Post_Data());
        downloadBtn.on('click', () => s.saveCanvas(p5canvas, (!input_name[0].value ? img_name_default : input_name[0].value), 'jpg'));

        console.log(postBtn)
    }
  
    sketch.draw = function () {
        if (s.mouseIsPressed) {
        s.line(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            p5_2.replicate(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            //deml_gotResults(doodleNet_classify(), "#DoodleNet");
            if(modelLoaded && s.frameCount % predict_interval === 0) classifier.classify(p5canvas2, ml5_gotResults);
        }
    }

}

function handleFile(file) {
    print(file);
    if (file.type.match('image')) {
      img = $('body').append('<img src="'+file.data+'"></img>');
      //classifier.classify(img, (err, results) => gotResults(err, results, '#DoodleNet'));
      //classifier2.classify(img, (err, results) => gotResults(err, results, '#MobileNet'));
    } 
  }

//Initialize Sketches
p5_1 = new p5(p5_1);

/* REST Method Calls */
p5_1.httpGet(translation_url, 'json', (data) => { 
    translation = data
});

// POST DATA
function HTTP_Post_Data(){
    let data = {
        img_data: p5canvas.canvas.toDataURL(),
        img_name: input_name[0].value,
        img_path: server_path,
        user: "Daniel",
        ml5_bestfit: ml5_predictions[0],
        ml5: ml5_predictions
    }

    if (!data.img_name || data.img_name.length === 0) data.img_name = img_name_default; 
    p5_1.httpPost(doodle_url, 'json', data, (result) => server_path = result.img_path); 
}