document.addEventListener("DOMContentLoaded", async function () {
    const servicesList = document.getElementById("services-list");

    try {
        const response = await fetch("http://localhost:3000/api/services"); // Make sure backend is running
        const services = await response.json();

        servicesList.innerHTML = ""; // Clear existing content

        services.forEach(service => {
            const serviceCard = document.createElement("div");
            serviceCard.classList.add("service-card");

            // Use the uploaded image, or fallback to a default image
            const imageUrl = service.image ? `http://localhost:3000${service.image}` : "../media/services/default.jpg";

            serviceCard.innerHTML = `
                <img src="${imageUrl}" alt="${service.name}" class="service-image">
                <h2 class="service-title">${service.name}</h2>
                <p class="service-description">${service.description}</p>
            `;

            servicesList.appendChild(serviceCard);
        });
    } catch (error) {
        console.error("Error loading services:", error);
        servicesList.innerHTML = "<p>Failed to load services. Please try again later.</p>";
    }
});