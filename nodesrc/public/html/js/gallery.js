const domain = window.location.origin;
const url_search = domain+'/images/search';
const url_images = domain+'/assets/doodles/';
var img_container;
var images_found;
var current_key;

function setup(){}
$(window).on('load', function() {
    $('#btn_search').on('click', () => HTTP_Search_Images());
    img_container = $('#image_container');
});


function HTTP_Search_Images(){
    const params = {
        img_name: $('#input_img_name')[0].value,
        user_searched: $('#input_user')[0].value,
        ml5_bestfit: $('#input_ml5_bestfit')[0].value,
        ml5_bestfit_conf: ""
    }

    $('#http_loader').removeClass('loaderhidden');
    $('#btn_search').prop("disabled",true);

    httpPost(url_search, 'json', params, (result) => {
        $('#http_loader').addClass('loaderhidden');
        $('#btn_search').prop("disabled",false);

        images_found = result;
        if(images_found.images.length == 0) display_message('No Images found');    
        else display_message(images_found.images.length + ' Images found');
        load_images();

    },(err) => {
        display_message('Something went wrong', true);

        $('#http_loader').addClass('loaderhidden');
        $('#btn_search').prop("disabled",false);
        console.log(err);
    }); 
}

 

async function load_images() {

    const images = images_found.images;
    const key = images_found.key;

    console.log(current_key + ' ' + key);
    if(current_key && current_key == key) return;
    current_key = key;
    img_container.empty();

    for(let i=0; i<images.length; i++){
        // if already a newer search has been done, stop loading old pictures
        if(key != images_found.key) return;
        img_container.append(create_Display_Object(images[i]));
    }

}

function create_Display_Object(img_obj){

    let div = '<div class="display">';
    div += '<p class="imgName">'+img_obj.img_name+'</p>';
    div += '<p class="user">'+ img_obj.user_display +'</p>'; 
    div += '<img src="'+ (url_images+img_obj.img_path) +'">';

    let conf = Math.round(img_obj.ml5_bestfit.confidence*10000)/100 + '%';
    if(conf.length == 4) conf = '0'+conf;

    div += '<p class="conf">' + conf + '</p>';
    div += '<p class="label">'+ img_obj.ml5_bestfit.label +'</p>';
    
    
    return div + '</div>';
}