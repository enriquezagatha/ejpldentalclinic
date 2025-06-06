<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Personnel Login - EJPL Dental Clinic</title>
    <link rel="stylesheet" href="../Medical Personnel/personnellogin.css">
</head>
<body>
    <div class="container">
        <button class="personnel-back-button" onclick="goPersonnelBack()">← Back</button>
        <div class="logo">
            <img src="../media/logo/EJPL.png" alt="EJPL Dental Clinic Logo">
        </div>
        <h1>MEDICAL PERSONNEL LOG IN</h1>
        <div class="login-form">
            <input type="email" id="email" placeholder="Email Address" class="input-field" required>
            <input type="password" id="password" placeholder="Password" class="input-field" required>
            <a href="forgotpassword-personnel.html" class="create-account-link"> Forgot Password?</a></p>
            <center><button class="login-button" onclick="goPersonnelLogIn()">LOGIN</button></center>
        </div>
        <div id="notification" style="text-align:center; margin-top:10px;"></div>
    </div>

        <!-- Change Password Modal -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <span class="close-btn" id="closeModalBtn">&times;</span>
            <h2>Change Your Password</h2>
            <form id="changePasswordForm">
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" required>
                
                <label for="confirmPassword">Confirm New Password:</label>
                <input type="password" id="confirmPassword" required>
                
                <button type="submit" id="submitPasswordBtn">Submit</button>
            </form>
            <p id="passwordError" style="color: red; display: none;">Passwords do not match!</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Close modal when clicking on <span> (x)
            const closeModalBtn = document.getElementById('closeModalBtn');
            if (closeModalBtn) {
                closeModalBtn.onclick = function () {
                    const modal = document.getElementById('changePasswordModal');
                    modal.style.display = 'none';

                    // Clear email and password fields in the login form
                    const emailField = document.getElementById('email');
                    const passwordField = document.getElementById('password');
                    if (emailField) emailField.value = ''; // Clear email field
                    if (passwordField) passwordField.value = ''; // Clear password field

                    // Clear fields in the change password modal
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                };
            }

            // Check if the sessionStorage flag exists
            const shouldClearLoginForm = sessionStorage.getItem('clearLoginForm');
            if (shouldClearLoginForm === 'true') {
                // Clear the login form fields
                const emailField = document.getElementById('email');
                const passwordField = document.getElementById('password');
                if (emailField) emailField.value = '';
                if (passwordField) passwordField.value = '';

                console.log('Login form cleared.');

                // Remove the flag from sessionStorage
                sessionStorage.removeItem('clearLoginForm');
            }

            // Close modal if the user clicks outside of it
            window.onclick = function (event) {
                const modal = document.getElementById('changePasswordModal');
                if (event.target === modal) {
                    modal.style.display = 'none'; // Hide the modal if clicked outside
                }
            };
        });

        // Redirect to profile page
        function goPersonnelBack() {
            window.location.href = "/main page/profile.html";
        }

        async function goPersonnelLogIn() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showNotification('Please provide email and password.', 'red');
                return;
            }

            const response = await fetch('/medical-personnel/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const result = await response.json();
                showNotification('Login successful.', 'green');

                if (result.isGeneratedPassword) {
                    // If the password is generated, show the modal
                    setTimeout(() => {
                        showChangePasswordModal();
                    }, 1000);
                } else {
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = 'personnel-home.html';
                    }, 1000);
                }
            } else {
                const result = await response.json();
                showNotification(result.message || 'An unknown error occurred.', 'red');
            }
        }

        // Show the change password modal
        function showChangePasswordModal() {
            const modal = document.getElementById('changePasswordModal');
            modal.style.display = 'block'; // Show the modal
        }

        // Handle password change form submission
        document.getElementById('changePasswordForm').onsubmit = async function (event) {
            event.preventDefault(); // Prevent normal form submission

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const passwordError = document.getElementById('passwordError'); // Get the error element

            // Check if passwords match
            if (newPassword !== confirmPassword) {
                passwordError.style.display = 'block'; // Show error if passwords do not match

                // Hide the error after 2 seconds
                setTimeout(() => {
                    passwordError.style.display = 'none'; // Hide password error after 3 seconds
                }, 2000);

                return;
            } else {
                passwordError.style.display = 'none'; // Hide error if passwords match
            }

            const email = document.getElementById('email')?.value || ''; // Get email if exists
            const response = await fetch('/medical-personnel/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword }),
            });

            if (response.ok) {
                showNotification('Password changed successfully.', 'green');
                
                // Close the modal after success
                const modal = document.getElementById('changePasswordModal');
                modal.style.display = 'none';

                // Reset the form fields in the modal
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                //Clear email and password fields in the login form after successful password change
                const emailField = document.getElementById('email');
                const passwordField = document.getElementById('password');
                if (emailField) emailField.value = ''; // Clear email field
                if (passwordField) passwordField.value = ''; // Clear password field

            } else {
                const result = await response.json();
                showNotification(result.message || 'Error changing password.', 'red');
            }
        };

        // Show Notification (success or error message)
        function showNotification(message, color) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.style.color = color;
            notification.style.display = 'block';

            // Set timeout to hide notification after 3 seconds
            setTimeout(() => {
                notification.textContent = ''; // Clear text
                notification.style.display = 'none'; // Hide notification
            }, 3000);
        }

    </script>      
</body>
</html>