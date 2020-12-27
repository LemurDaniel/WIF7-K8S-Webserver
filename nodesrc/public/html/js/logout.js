

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