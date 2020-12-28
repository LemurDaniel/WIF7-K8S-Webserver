const domain = window.location.origin;
const url_search = domain+'/images/search';
const url_images = domain+'/assets/doodles/';
var img_container;
var images_found;

function setup(){}
$(window).on('load', function() {
    $('#btn_search').on('click', () => HTTP_Search_Images());
    img_container = $('#image_container');
});


function HTTP_Search_Images(){
    const params = {
        img_name: $('#input_user')[0].value,
        user_searched: $('#input_img_name')[0].value,
        ml5_bestfit: $('#input_ml5_bestfit')[0].value,
        ml5_bestfit_conf: ""
    }

    $('#http_loader').removeClass('loaderhidden');
    $('#btn_search').prop("disabled",true);
    img_container.empty();

    httpPost(url_search, 'json', params, (result) => {
        $('#http_loader').addClass('loaderhidden');
        $('#btn_search').prop("disabled",false);

        images_found = result;
        if(images_found.images.length == 0) return display_message('No Images found');
        
        display_message(images_found.images.length + ' Images found');
        load_images();

    },(err) => {
        display_message('Something went wrong', true);

        $('#http_loader').addClass('loaderhidden');
        $('#btn_search').prop("disabled",false);
        console.log(err);
    }); 
}

 

async function load_images(){

    const images = images_found.images;
    const key = images_found.key;

    for(let i=0; i<images.length; i++){
        // if already a newer search has been done, stop loading old pictures
        if(key != images_found.key) return;

        const src = url_images + images[i].img_path;
        img_container.append('<div class="display"> <img src="'+src+'"> </div>');
    }

}