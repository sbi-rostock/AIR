var project_data = null;
async function Fairdom() {

    om_container = $('#fairdom_tab_content');

    $(
        ```
        <form id="loginForm">
            <label for="username">Username:</label>
            <input
            type="text"
            id="username"
            name="username"
            required
            />

            <label for="password">Password:</label>
            <input
            type="password"
            id="password"
            name="password"
            required
            />

            <button type="submit">Login</button>
        </form>
        ```
    ).appendTo(om_container);


    $(
        /*<div class="text-center">
            <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
        </div>*/
    /*html*/`
    
    `).appendTo('#fairdom_tab_content');


    const loginForm = document.getElementById("loginForm");

    // Handle the login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent the form from submitting the normal way

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            project_data = JSON.parse(await getDataFromServer("login", data = {"session": session_token, "username":username, "password":password}, type = "POST"));
            console.log(project_data);
        } catch (err) {
            console.error("Error while logging in:", err);
            alert("An error occurred. See console for details.");
        }
    });

}