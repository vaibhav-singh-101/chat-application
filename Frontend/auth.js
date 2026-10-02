const API_URL = "http://localhost:5000/api/auth";


// =====================================
// REGISTER
// =====================================

async function register() {

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    // Check empty fields
    if (!username || !email || !password) {
        message.innerText = "Please fill all fields";
        return;
    }

    try {

        const response = await fetch(`${API_URL}/register`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        console.log("Register response:", data);

        if (response.ok) {

            message.innerText = "Registration successful!";

            // Go to login page after 1 second
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

        } else {

            message.innerText =
                data.message || "Registration failed";

        }

    } catch (error) {

        console.error("Register error:", error);

        message.innerText =
            "Server connection failed";

    }
}


// =====================================
// LOGIN
// =====================================

async function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    // Check empty fields
    if (!email || !password) {

        message.innerText =
            "Please enter email and password";

        return;
    }

    try {

        const response = await fetch(`${API_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                email: email,
                password: password

            })

        });

        const data = await response.json();

        console.log("Login response:", data);


        // =====================================
        // LOGIN SUCCESS
        // =====================================

        if (response.ok) {

            console.log("JWT received:", data.token);


            // Save authentication information
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "username",
                data.user.username
            );

            // IMPORTANT:
            // Save email for profile page
            localStorage.setItem(
                "email",
                data.user.email
            );


            // Check saved data
            console.log(
                "Token:",
                localStorage.getItem("token")
            );

            console.log(
                "Username:",
                localStorage.getItem("username")
            );

            console.log(
                "Email:",
                localStorage.getItem("email")
            );


            message.innerText =
                "Login successful!";


            // Redirect to chat application
            setTimeout(() => {

                window.location.href =
                    "index.html";

            }, 1000);

        } else {

            message.innerText =
                data.message || "Login failed";

        }

    } catch (error) {

        console.error("Login error:", error);

        message.innerText =
            "Server connection failed";

    }
}