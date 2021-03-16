// Works best with size=280 and stroke_weight=15
const canvas_size = 280;
const stroke_weight = 15;

const FRAME_RATE = 60;
const FRAME_RATE_SHOWCASE = 20;

const img_name_default = "My Drawing";
const grayscale = false;
const predict_interval = 5; //One Prediction in <number> frames when drawing

const domain = window.location.origin;
const url_save =  domain+'/images/save';
const url_search = domain+'images/search';
const url_getData =  domain+'/images/data';
const translation_url =  domain+'/translation';

//const classifier_model = "DarkNet-tiny";
//const classifier_model = "Darknet-reference";
//const classifier_model = "MobileNet";
const classifier_model = "DoodleNet";
const classifier = ml5.imageClassifier(classifier_model, () => { 
    modelLoaded = true;
    $('#predictions_loader').remove();
    classifier.classify(p5canvas2, ml5_gotResults);
});

var modelLoaded;
var p5canvas;
var p5canvas2;

var p5_1;  // main canvas
var p5_2;  // hidden canvas
var p5_3;  // showcase

var ml5_predictions;
var server_path = '';

var translation;


 // Define input elements
 var input_weight;
 var clearBtn;
 var downloadBtn;
 var uploadBtn;
 var postBtn;
 var input_color;
 var input_name;
 var input_file;
 var rubber_switch;
 var rubber_state = 0;
 


// ML5 Functions
function ml5_gotResults(err, results) {

    if(err) {
        ml5_predictions = [ 
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: '-', confidence: 0.9999 },
        { label: 'Classifier is', confidence: 0.9999 },
        { label: 'currently', confidence: 0.9999 },
        { label: 'unavailable', confidence: 0.9999 } 
        ]
    }else {
        ml5_predictions = results;
        Translate_Data();
    }

    const html_id = '#ml5_DoodleNet';
    $(html_id + ' ol ').remove();
    $(html_id).append('<ol></ol>');
    ml5_predictions.forEach(element => {
        let conf = Math.round(element.confidence*100);
        $(html_id + ' ol ').append('<li>('+conf+'%) '+element.label+'</li>');
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
    One with color wich the user can see and a second hidden one,
    which draws the same picture parallel with only a black stroke.
*/
p5_2 = function (sketch) {

    sketch.setup = function () {
        p5canvas2 = sketch.createCanvas(canvas_size, canvas_size);
        p5canvas2.parent("p5_canvas_hidden"); 
        sketch.strokeWeight(stroke_weight);
        sketch.background(255); 
    }
}


// Showcase for strokesize and color
p5_3 = function (sketch) {

    let sh_size = 35;

    sketch.setup = function () {
        sketch.createCanvas(sh_size, sh_size).parent("weight_showcase");
        sketch.background(255, 255, 255, 0);
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
            if(!rubber_state) p5_1.stroke(input_color[0].value);
            sketch.frameRate(0)
        });


        sketch.draw();
    }

    sketch.draw = function () {
        sketch.clear();
        sketch.background(255, 255, 255, 0);
        sketch.fill(input_color[0].value);
        // Set size relative to strokesize
        // maps range(1,25) to (1, showcasesize) || 25 is maxval of slider
        const size = sketch.map(input_weight[0].value, input_weight[0].min, input_weight[0].max, 2, sh_size - 5);
        sketch.circle(sh_size / 2, sh_size / 2, size);
    }
}
    // showcase END


// P5 MAIN CANVAS
p5_1 = function (sketch) {

    let s = sketch;
    
    sketch.setup = function () {

        // Initialize showcase
        p5_3 = new p5(p5_3);
        // Initialize hiddencanvas
        p5_2 = new p5(p5_2);
        p5_2.frameRate(FRAME_RATE);
        sketch.frameRate(FRAME_RATE);
   
        // Create main canvas
        p5canvas = sketch.createCanvas(canvas_size, canvas_size);
        p5canvas.parent("p5_canvas");   
        sketch.background(255);
        sketch.strokeWeight(stroke_weight);
    }
  
    sketch.mouseReleased = () => {
        if(!rubber_state && s.mouseButton === s.RIGHT ) {
            $('.switch').toggleClass('active inactive');
            $('.switch img').toggle();
        }
    }

    sketch.mousePressed = () => {
        if(!rubber_state && s.mouseButton === s.RIGHT ) { 
            $('.switch').toggleClass('active inactive');
            $('.switch img').toggle();
        }
    }

    sketch.draw = () => {
        if (s.mouseIsPressed) {
            if(rubber_state || s.mouseButton === s.RIGHT){
                p5_1.stroke(255);
                p5_2.stroke(255);
            } else {
                p5_1.stroke(input_color[0].value);
                p5_2.stroke(0);
            }

            s.line(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            // Replicate doodle to second b/w canvas
            p5_2.line(s.mouseX, s.mouseY, s.pmouseX, s.pmouseY);
            //deml_gotResults(doodleNet_classify(), "#DoodleNet");
            if(modelLoaded && s.frameCount % predict_interval === 0) classifier.classify(p5canvas2, ml5_gotResults);
        }
    }

}

/* REST Method Calls */

// POST DATA
function HTTP_Post_Data(){
    const data = {
        img_data: p5canvas.canvas.toDataURL(),
        img_name: input_name[0].value,
        img_path: server_path,
        ml5_bestfit: ml5_predictions[0],
        ml5: ml5_predictions
    }
    if (!data.img_name || data.img_name.length === 0) data.img_name = img_name_default; 

    $('#http_loader').removeClass('loaderhidden');
    postBtn.prop("disabled",true);

    p5_1.httpPost(url_save, 'json', data, (result) => {
        if(!server_path) display_message('Image has been saved on server');
        else display_message('Image on server has been updated');
        server_path = result.img_path;

        $('#http_loader').addClass('loaderhidden');
        postBtn.prop("disabled",false);
    }, (err) => {
        display_message('Something went wrong', true);

        $('#http_loader').addClass('loaderhidden');
        postBtn.prop("disabled",false);
        console.log(err);
    }); 
}


$(window).on('load', function() {

    // Define input elements
    input_color = $('#input_color');
    input_weight =  $('#input_weight');
    clearBtn = $('#btn_clear');
    downloadBtn = $('#btn_download');
    uploadBtn = $('#btn_upload');
    postBtn = $('#btn_post');
    input_name =  $('#input_name');
    rubber_switch = $('.switch');
    createNewBtn = $('#btn_new_doodle');
    //$('.info_container').hide();

    // reload page to draw new image
    createNewBtn.on('click', () => window.location.reload());

    // Suppress chars ä,ö and ü
    input_name.keypress(function(e){
        switch(e.which){
            case 252: return false;
            case 246: return false;
            case 228: return false;
        }
    });

    var rubber_clicked = false;
    rubber_switch.on('click', () => rubber_clicked = true);
    rubber_switch.on('mouseenter', () => $('.switch img').toggle());
    rubber_switch.on('mouseleave', () => {
        if(rubber_clicked) {
            $('.switch').toggleClass('active inactive');
            rubber_state = (rubber_state+1) % 2;
            rubber_clicked = false;
        } else {
            $('.switch img').toggle();
        }
    });


    //Initialize Sketches
    p5_1 = new p5(p5_1);
    //Get translation
    p5_1.httpGet(translation_url, 'json', (data) => translation = data);

    // Button Functionality
    postBtn.on('click', () => HTTP_Post_Data());
    clearBtn.on('click', () => {p5_1.background(255); p5_2.background(255), classifier.classify(p5canvas2, ml5_gotResults)});
    downloadBtn.on('click', () => p5_1.saveCanvas(p5canvas, (!input_name[0].value ? img_name_default : input_name[0].value), 'jpg'));

});