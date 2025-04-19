const dentist_API_URL = "http://localhost:3000/api/dentists"; // Backend URL

async function fetchdentists() {
  const dentistsList = document.getElementById("dentists-list");

  // Show "Loading dentists..." message
  dentistsList.innerHTML = `
    <div class="flex flex-col items-center my-12 h-screen">
      <i class="fas fa-spinner fa-spin text-4xl mb-4 text-gray-400"></i>
      <p class="text-lg font-semibold text-gray-500">Loading dentists...</p>
    </div>
  `;

  try {
    const response = await fetch(dentist_API_URL);
    const dentists = await response.json();

    dentistsList.innerHTML = ""; // Clear loading message

    dentistsList.innerHTML = `
      <ul id="team-member" class="list-none mx-auto my-12 mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
        ${dentists
          .map((dentist) => {
            // Determine the title based on gender
            const title =
              dentist.gender === "male"
                ? "Dr."
                : dentist.gender === "female"
                ? "Dra."
                : "";

            // Format contact number or provide a fallback if undefined
            const contactNumber = dentist.contact
              ? dentist.contact.replace(/^\+?\d+\s?/, "") // Removes the country code and space
              : "N/A";

            return `
                <li class="flex flex-col border border-solid border-slate-900 dark:border-gray-100 bg-[#F5F5F5] pt-4 px-2 shadow-xl">
                    <img src="${
                      dentist.image
                        ? dentist.image
                        : "https://via.placeholder.com/150"
                    }" alt="${
              dentist.name
            }" class="mx-auto mb-4 w-[300px] h-[350px] object-cover">
                    <h3 class="text-xl px-1 text-left text-black font-inter font-bold">${title} ${
              dentist.firstName
            } ${dentist.lastName}</h3>
                    <p class="text-center text-black mt-8 mb-2 tracking-widest">${contactNumber} ${
              dentist.contact
            }</p>
                </li>`;
          })
          .join("")}
      </ul>`;
  } catch (error) {
    console.error("Error fetching dentists:", error);
    dentistsList.innerHTML =
      "<p class='text-center text-red-500'>Failed to load dentists. Please try again later.</p>";
  }
}

// Load dentists on page load
document.addEventListener("DOMContentLoaded", fetchdentists);
