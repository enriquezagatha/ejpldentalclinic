const dentist_API_URL = `${window.location.origin}/api/dentists`; // Backend URL

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

            // Format schedule
            let scheduleHtml = "";
            if (dentist.schedule && dentist.schedule.useClinicHours) {
              scheduleHtml = `<span class="text-green-700 font-semibold">Clinic's Hours</span>`;
            } else if (
              dentist.schedule &&
              Array.isArray(dentist.schedule.days) &&
              dentist.schedule.days.length > 0
            ) {
              scheduleHtml =
                "<ul class='text-gray-700 text-sm mt-2'>" +
                dentist.schedule.days
                  .map(
                    (d) =>
                      `<li><span class="font-semibold capitalize">${d.day}:</span> ${d.start} - ${d.end}</li>`
                  )
                  .join("") +
                "</ul>";
            } else {
              scheduleHtml = `<span class="text-gray-400">No schedule set</span>`;
            }

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
                    <div class="mt-2 mb-2">
                      <span class="block text-gray-600 font-medium">Schedule:</span>
                      ${scheduleHtml}
                    </div>
                    <p class="text-center text-black mt-10 mb-2 tracking-widest"></p>
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
