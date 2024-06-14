document.getElementById('role').addEventListener('change', function() {
    const role = document.getElementById('role').value;
    const registerParagraph = document.getElementById('registerParagraph');
    if (role === 'user') {
        registerParagraph.style.display = 'block';
    } else {
        registerParagraph.style.display = 'none';
    }
});

$(document).ready(function(){
    $('#login').click(function(){
        $('.login-form').addClass('popup');
    });
    
    $('#registerLink').click(function(){
        $('.login-form').removeClass('popup');
        $('.register-form').addClass('popup');
    });

    $('.login-form form .fa-times').click(function(){
        $('.login-form').removeClass('popup');
    });

    $('.register-form form .fa-times').click(function(){
        $('.register-form').removeClass('popup');
    });
});

function formvalidate() {
    var errorSpan = document.getElementById("errorMessages");
    var user_name = document.getElementById("user_name").value;
    if (user_name === "" || /\d/.test(user_name)) {
        errorSpan.innerHTML = "Please enter a valid username.";
        errorSpan.style.display = "block";
        return false;
    }

    var email = document.getElementById("email").value;
    if (email === "" || !isValidEmail(email)) {
        errorSpan.innerHTML = "Please enter a valid email.";
        errorSpan.style.display = "block";
        return false;
    }

    var phone = document.getElementById("phone").value;
    if (phone.length !== 10 || isNaN(phone)) {
        errorSpan.innerHTML = "Enter a valid 10-digit phone number.";
        errorSpan.style.display = "block";
        return false;
    }

    var password = document.getElementById("password").value;
    var pattern = /^(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8}$/;
    if (!pattern.test(password)) {
        errorSpan.innerHTML = "Password must be exactly 8 characters long, and include one digit and one special character.";
        errorSpan.style.display = "block";
        return false;
    }

    // If all validations pass
    errorSpan.innerHTML = "";
    errorSpan.style.display = "none";
    return true;
}

function isValidEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function setLoginAction(event) {
    event.preventDefault(); // Prevent the default form submission

    var role = document.getElementById("role").value;
    var form = document.getElementById("loginForm");

    if (role === "user") {
        form.action = "/loginuser";
    } else if (role === "admin") {
        form.action = "/loginadmin";
    }

    fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form))
    })
    .then(response => response.text()) // Parse the response as text
    .then(html => {
        // Check if the response contains the notification container
        if (html.includes("notification-container")) {
            // Display the notification HTML
            document.getElementById('notificationPlaceholder').innerHTML = html;

            // Add event listener to close button
            document.getElementById('closeButton').addEventListener('click', function() {
                document.getElementById('notificationContainer').style.display = 'none';
            });

            // Automatically hide the notification after 5 seconds
            setTimeout(function() {
                document.getElementById('notificationContainer').style.display = 'none';
            }, 5000);
        } else {
            // Redirect to the specified URL
            if (role === "user") {
                window.location.href = "/user";
            } 
            else if (role === "admin") {
                window.location.href = "/admin";
            }
         }
    })
    .catch(error => console.error('Error:', error));

  
}
