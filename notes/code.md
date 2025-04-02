<script>
    function showLogoutModal() {
        const overlay = document.getElementById('logout-overlay');
        overlay.style.display = 'flex'; // Show the modal
    }

    function confirmLogout(isConfirmed) {
        const overlay = document.getElementById('logout-overlay');
        if (isConfirmed) {
            window.location.href = "/main page/home.html";
        } else {
            overlay.style.display = 'none'; // Hide the modal
        }
    }

    function displayProfileInfo(data) {
        const profileInfoDiv = document.getElementById('profile-info');
        profileInfoDiv.innerHTML = `
            <p><strong>First Name:</strong> ${data.firstName}</p>
            <p><strong>Last Name:</strong> ${data.lastName}</p>
            <p><strong>Birthday:</strong> ${data.birthday}</p>
            <p><strong>Email:</strong> ${data.email}</p>
        `;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const profileResponse = await fetch('/patient/profile');
        
        if (profileResponse.ok) {
            const patientData = await profileResponse.json();
            displayProfileInfo(patientData);
        } else {
            console.error('Error fetching patient profile:', profileResponse.status, profileResponse.statusText);
        }
    });

    function toggleEditForm() {
        const overlay = document.getElementById('overlay');
        const formContainer = document.getElementById('form-container');
        const isHidden = formContainer.style.display === 'none' || formContainer.style.display === '';
        
        if (isHidden) {
            formContainer.style.display = 'block';
            overlay.style.display = 'block';
            hideMessages();
        } else {
            formContainer.style.display = 'none';
            overlay.style.display = 'none';
            document.getElementById('edit-form').reset();
        }
    }

    function hideMessages() {
        const errorMessageDiv = document.getElementById('error-message');
        const successMessageDiv = document.getElementById('success-message');
        errorMessageDiv.style.display = 'none';
        successMessageDiv.style.display = 'none';
    }

    function confirmSave() {
        document.getElementById('profileconfirmation-modal').style.display = 'flex';
    }

    function confirmChanges(isConfirmed) {
        const modal = document.getElementById('profileconfirmation-modal');
        if (isConfirmed) {
            updateProfile();
        }
        modal.style.display = 'none';
    }

    async function updateProfile() {
        const email = document.getElementById('edit-email').value;
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;

        const errorMessageDiv = document.getElementById('error-message');
        const successMessageDiv = document.getElementById('success-message');
        errorMessageDiv.innerText = '';
        errorMessageDiv.style.display = 'none';
        successMessageDiv.innerText = '';
        successMessageDiv.style.display = 'none';

        const response = await fetch('/patient/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, currentPassword, newPassword }),
        });

        if (response.ok) {
            const result = await response.json();
            let successMessage = '';
            if (result.emailUpdated) {
                successMessage += 'Email updated successfully. ';
            }
            if (result.passwordUpdated) {
                successMessage += 'Password updated successfully. ';
            }

            if (successMessage.trim()) {
                successMessageDiv.innerText = successMessage.trim();
                successMessageDiv.style.display = 'block';
            }

            setTimeout(() => {
                successMessageDiv.style.display = 'none';
            }, 3000);

            document.getElementById('edit-form').reset();

            const profileResponse = await fetch('/patient/profile');
            if (profileResponse.ok) {
                const patientData = await profileResponse.json();
                displayProfileInfo(patientData);
            } else {
                console.error('Error fetching updated patient profile:', profileResponse.statusText);
            }
        } else {
            const result = await response.json();
            errorMessageDiv.innerText = result.message || 'An error occurred during profile update.';
            errorMessageDiv.style.display = 'block';
        }
    }
</script>