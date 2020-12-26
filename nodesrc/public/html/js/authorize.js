const domain = window.location.origin;
const url_register =  domain+'/user/register';
const url_login = domain+'/user/login';

// state 0 - create Account | 1 -  Log into Account
var state = 0;
var sending = false;

function setup(){}
$(window).on('load', function() {

    // Suppress chars ä, ö and ü
    $('input').keypress(function(e){
        switch(e.which){
            case 252: return false;
            case 246: return false;
            case 228: return false;
        }
    });

    //initial switch to Log in
    switch_state();
    // call state_switch when top button is pressed
    $('#state_switch').on('click', () => switch_state());

    // Send data if bottom button is pressed
    $('#send_data').on('click', () => {
        disable_input(true);
        sending = true;

        // error if paramertes still missing
        if(!check_missing_input()) return handle_error({err: 'There are missing fields'})

        // show indefinite loading indicator
        $('#loader').removeClass('loaderhidden');

        // check wether to log in or register
       if(state) login();
       else register();
    })

});

function switch_state() {
    state = (state+1) % 2; // toggle state between 1 and 0
    $('#password_repeat').toggleClass('hidden shown'); // show fields on register
    $('#display_name').toggleClass('hidden shown'); // and hide fields on login
    $('.header_container h3').remove(); // remove header text

    // replace text according to state
    if(state == 1) {
        $('#state_switch')[0].value = 'You don\'t have an account?';
        $('.header_container').append('<h3 class="header">Log into your Account</h3>');
        $('#send_data')[0].value = 'Log in';
    } else {
        $('#state_switch')[0].value = 'You already have an account?';
        $('.header_container').append('<h3 class="header">Create a new Account</h3>');
        $('#send_data')[0].value = 'Create Account';
    }
}

function check_missing_input(){
    if(!$('#login_name')[0].value) return false;
    if(!$('#password')[0].value) return false;
    if(!state && !$('#password_repeat')[0].value) return false;
    if(!state && !$('#display_name')[0].value) return false;
    return true;
}

function disable_input(bool) {
    $('#state_switch').prop("disabled",bool);
    $('#display_name').prop("disabled",bool);
    $('#login_name').prop("disabled",bool);
    $('#password_repeat').prop("disabled",bool);
    $('#password').prop("disabled",bool);
    $('#send_data').prop("disabled",bool);
}


var timeout;
function handle_error (message) {
    sending = false;
    disable_input(false);

    // replace error message
    $('#error_display p').remove();
    $('#error_display').append('<p class="header">'+message.err+'</p>');
    // show error
    $('#error_display').removeClass('hidden');
    $('#error_display').addClass('shown');
    // hide loader
    $('#loader').addClass('loaderhidden');

    // if error changed, don't engage old timer anymore
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
         // hide error message again after some time passed
        $('#error_display').removeClass('shown');
        $('#error_display').addClass('hidden');
    }, 4000);
}


function register(){

    // if passwords don't match return
    if($('#password')[0].value != $('#password_repeat')[0].value) return handle_error({ err:'Passwords don\'t match'});

    // create user object
    const user = {
        username_display: $('#display_name')[0].value,
        username: $('#login_name')[0].value,
        password: $('#password')[0].value
    }

    //make post to endpoint with json-object
    httpPost(url_register, 'json', user, (result) => {
        if(!result.err) window.location.replace(domain);
        else handle_error(result);
    }, (err) => {
        handle_error({code:1, err:'The service is currently unavailable'});
    }); 
}

function login(){
    
    // create user object
    const user = {
        username: $('#login_name')[0].value,
        password: $('#password')[0].value
    }

    //make post to endpoint with json-object
    httpPost(url_login, 'json', user, (result) => {
        if(!result.err) window.location.replace(domain);
        else handle_error(result);
    }, (err) => {
        handle_error({code:1, err:'The service is currently unavailable'});
    }); 
}
