

$(window).on('load', function() {

    $('#logout_button').on('click', () => {
        const bool = confirm("Are you sure you want to logout?");
        if (bool == false) return;
        
        /* not possible via js, because httpOnly cookie
        document.cookie = "doodle_token=nix; path=/; HttpOnly; max-age=0";
        document.cookie = "doodle_token=nix; path=/; HttpOnly; secure; max-age=0";
        */

        // Get request on /user/logout automatically deletes cookie and redirects
        window.location.replace(window.location.origin+'/user/logout');
    });

});


var timeout;
function display_message (message, err) {

    // replace error message
    $('#info_display').empty();
    if(err) $('#info_display').append('<p class="red">'+message+'</p>');
    else    $('#info_display').append('<p class="green">'+message+'</p>');
    // show error
    $('#info_display').removeClass('hidden');
    $('#info_display').addClass('shown');


    // if error changed, don't engage old timer anymore
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
         // hide error message again after some time passed
        $('#info_display').removeClass('shown');
        $('#info_display').addClass('hidden');
    }, 1000);
}