document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".payButton").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = document.getElementById("paymentModal");
      if (modal) {
        modal.style.display = "flex";
      }
    });
  });

  const closeModal = document.getElementById("closeModal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      const modal = document.getElementById("paymentModal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  }

  const appointmentsTableBody = document.querySelector("#appointments tbody");

  // Show "Loading appointments..." row
  appointmentsTableBody.innerHTML = `
          <tr id="loading-row">
              <td colspan="8" class="text-center text-gray-500 py-6">
                  <div class="flex flex-col items-center">
                      <i class="fas fa-spinner fa-spin text-4xl mb-2 text-gray-400"></i>
                      <p class="text-lg font-semibold">Loading payments...</p>
                  </div>
              </td>
          </tr>
      `;

  fetchProfile();
  fetchAppointments();
});

function displayProfileInfo(data) {
  const profilePicture = data.profilePicture
    ? `/uploads/${data.profilePicture}`
    : "../media/logo/default-profile.png";
  document.getElementById("sidebar-profile-picture").src = profilePicture;
  document.getElementById(
    "sidebar-full-name"
  ).innerText = `${data.firstName} ${data.lastName}`;
}

async function fetchProfile() {
  const response = await fetch("/api/patient/profile");
  if (response.ok) {
    const data = await response.json();
    displayProfileInfo(data);
  } else {
    console.error("Error fetching profile data");
  }
}

async function fetchAppointments() {
  const appointmentsTableBody = document.querySelector("#appointments tbody");
  try {
    const appointmentsResponse = await fetch(
      "/api/appointments/patient/appointments"
    ); // Call new endpoint
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();

      // Sort appointments by preferredDate in descending order (latest to oldest)
      appointmentsData.sort(
        (a, b) => new Date(b.preferredDate) - new Date(a.preferredDate)
      );

      console.log("Sorted Appointments:", appointmentsData); // Log the sorted appointments data

      if (appointmentsData.length === 0) {
        appointmentsTableBody.innerHTML = `
                      <tr>
                          <td colspan="8" class="text-center text-gray-500 py-6">
                              <div class="flex flex-col items-center">
                                  <i class="fas fa-calendar-times text-4xl mb-2 text-gray-400"></i>
                                  <p class="text-lg font-semibold">No Payments Found</p>
                                  <p class="text-sm text-gray-400 mb-4">
                                      <a href="typeofpatient.html" class="text-[#2C4A66] font-bold hover:underline">Book an Appointment Now</a>
                                  </p>
                              </div>
                          </td>
                      </tr>
                  `;
        return;
      }

      displayAppointments(appointmentsData);
    } else if (appointmentsResponse.status === 404) {
      appointmentsTableBody.innerHTML = `
                  <tr>
                          <td colspan="8" class="text-center text-gray-500 pt-8 py-6">
                              <div class="flex flex-col items-center">
                                  <i class="fas fa-wallet text-4xl mb-4 text-gray-400"></i> <!-- Updated icon -->
                                  <p class="text-lg font-semibold">No Payments Found</p>
                                  <p class="text-sm text-gray-400 mb-4">
                                      <a href="typeofpatient.html" class="text-[#2C4A66] font-bold hover:underline">Book an Appointment Now</a>
                                  </p>
                              </div>
                          </td>
                      </tr>
              `;
    } else {
      throw new Error("Failed to fetch appointments");
    }
  } catch (error) {
    console.error("Error fetching appointments:", error);
    appointmentsTableBody.innerHTML = `
              <tr>
                  <td colspan="8" class="text-center text-red-500 py-6">
                      <div class="flex flex-col items-center">
                          <i class="fas fa-exclamation-circle text-4xl mb-2 text-red-400"></i>
                          <p class="text-lg font-semibold">Failed to load appointments</p>
                          <p class="text-sm text-gray-400">Please try again later.</p>
                      </div>
                  </td>
              </tr>
          `;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString); // Parse the ISO date string
  const day = String(date.getDate()).padStart(2, "0"); // Ensure two-digit day
  const monthName = monthNames[date.getMonth()]; // Get month name
  const year = date.getFullYear(); // Get year
  return `${monthName} ${day}, ${year}`; // Format: Month Name Day, Year
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
