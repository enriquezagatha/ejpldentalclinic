document.addEventListener("DOMContentLoaded", async function () {
  const servicesList = document.getElementById("services-list");

  try {
    const response = await fetch("http://localhost:3000/api/services"); // Make sure backend is running
    const services = await response.json();

    servicesList.innerHTML = ""; // Clear existing content

    // Create a styled <ul> container
    const ul = document.createElement("ul");
    ul.classList.add(
      "list-none",
      "mx-auto",
      "my-12",
      "mt-16",
      "grid",
      "grid-cols-1",
      "sm:grid-cols-2",
      "xl:grid-cols-3", // Ensure 3 items per row on medium screens and above
      "gap-8",
      "place-items-center"
    );

    services.forEach((service) => {
      const li = document.createElement("li");
      li.classList.add(
        "md:w-2/5",
        "flex",
        "flex-col",
        "border",
        "border-solid",
        "border-slate-900",
        "dark:border-gray-100",
        "bg-[#F5F5F5]",
        "pt-4",
        "px-2",
        "shadow-xl"
      );

      // Use the uploaded image, or fallback to a default image
      const imageUrl = service.image
        ? `http://localhost:3000${service.image}`
        : "https://via.placeholder.com/150";

      li.innerHTML = `
                <img src="${imageUrl}" alt="${service.name}" class="px-1 w-[350px] h-[200px] object-cover mx-auto mb-4">
                <h3 class="text-xl px-1 text-center text-black font-inter font-bold">${service.name}</h3>
                <p class="text-center px-1 text-black mt-4 mb-8">${service.description}</p>
            `;

      ul.appendChild(li);
    });

    servicesList.appendChild(ul);
  } catch (error) {
    console.error("Error loading services:", error);
    servicesList.innerHTML =
      "<p>Failed to load services. Please try again later.</p>";
  }
});
