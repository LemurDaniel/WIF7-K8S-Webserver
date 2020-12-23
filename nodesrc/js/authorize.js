const domain = window.location.href;
const url_register =  domain+'/register';
const url_login = domain+'/login';

var state = 0;
var sending = false;

function setup(){}
$(window).on('load', function() {

    switch_state();
    $('#state_switch').on('click', () => switch_state());

    $('#send_data').on('click', () => {
        disable_input(true);
        sending = true;

        if(!check_missing_input()) return handle_error('There are missing fields')

        $('#loader').removeClass('loaderhidden');
        $('#loader').addClass('loadershown');
       
       if(state) login();
       else register();
    })

});

function switch_state() {
    state = (state+1) % 2;
    $('#password_repeat').toggleClass('hidden shown');
    $('#display_name').toggleClass('hidden shown');
    $('.header_container h3').remove();
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

function handle_error (err) {
    sending = false;
    disable_input(false);

    $('#error_display p').remove();
    $('#error_display').append('<p class="header">'+err+'</p>');
    $('#loader').removeClass('loadershown');
    $('#loader').addClass('loaderhidden');
}


function register(){

    if($('#password')[0].value != $('#password_repeat')[0].value) return handle_error('Passwords don\'t match');

    const user = {
        username_display: $('#display_name')[0].value,
        username: $('#login_name')[0].value,
        password: $('#password')[0].value
    }

    httpPost(url_register, 'json', user, (result) => {
        console.log(result);
        window.location.replace(domain.replace('user', ''));
    }, (err) => {
        console.log(err);
        handle_error(err);
    }); 
}

function login(){
    
    const user = {
        username: $('#login_name')[0].value,
        password: $('#password')[0].value
    }

    httpPost(url_login, 'json', user, (result) => {
        console.log(result);
        window.location.replace(domain.replace('user', ''));
    }, (err) => {
        console.log(err.getReader());
        if(console.log(err.match('^[0-9]{3}$')))
        handle_error(err);
    }); 
}
