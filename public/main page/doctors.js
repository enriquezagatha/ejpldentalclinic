const dentist_API_URL = "http://localhost:3000/api/dentists"; // Backend URL

async function fetchdentists() {
    try {
        const response = await fetch(dentist_API_URL);
        const dentists = await response.json();
        const dentistsList = document.getElementById("dentists-list");

        dentistsList.innerHTML = ""; // Clear existing content
        dentists.forEach((dentist) => {
            // Determine the title based on gender
            const title = dentist.gender === 'male' ? 'Dr.' : dentist.gender === 'female' ? 'Dra.' : '';

            // Format contact number by removing prefix (assuming contact is in the format "+1-xxx-xxx-xxxx")
            const contactNumber = dentist.contact.replace(/^\+?\d+\s?/, ''); // Removes the country code and space

            dentistsList.innerHTML += `
                <div class="team-member">
                    <img src="${dentist.image ? dentist.image : 'https://via.placeholder.com/150'}" alt="${dentist.name}">
                    <h3>${title} ${dentist.firstName} ${dentist.lastName}</h3>
                    <h4>Contact: ${contactNumber}</h4>
                </div>`;
        });
    } catch (error) {
        console.error("Error fetching dentists:", error);
    }
}

// Load dentists on page load
document.addEventListener("DOMContentLoaded", fetchdentists);