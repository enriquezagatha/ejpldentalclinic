// Function to fetch and display total appointments
async function updateAppointmentTotals(data) {
  document.getElementById("totalPendingAppointments").innerText =
    data.pending || 0;
  document.getElementById("totalConfirmedAppointments").innerText =
    data.confirmed || 0;
  document.getElementById("totalCancelledAppointments").innerText =
    data.cancelled || 0;
  document.getElementById("totalCompletedAppointments").innerText =
    data.completed || 0;
}

// Function to fetch and update totals based on a filter
async function fetchAndUpdateTotals(filter = "all") {
  try {
    let url = `/api/appointments/total-status-counts?filter=${filter}`;

    // Add month and year parameters for monthly and yearly filters
    const month = document.getElementById("statusMonthlyFilter").value;
    const year = document.getElementById("statusYearlyFilter").value;

    if (filter === "monthly" || filter === "yearly") {
      if (month && year) {
        url += `&month=${month}&year=${year}`; // Ensure both month and year are included
      } else if (year) {
        url += `&year=${year}`;
      }
    }

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      updateAppointmentTotals(data);
    } else {
      console.error(
        "Failed to fetch filtered status counts:",
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching filtered status counts:", error);
  }
}

// Function to handle button selection styling
function setActiveFilterButton(selectedButtonId) {
  // Remove the active style from all buttons
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.classList.remove("bg-[#2C4A66]", "text-white");
    button.classList.add("bg-[#D9D9D9]", "text-black");
  });

  // Add the active style to the selected button
  const selectedButton = document.getElementById(selectedButtonId);
  selectedButton.classList.remove("bg-[#D9D9D9]", "text-black");
  selectedButton.classList.add("bg-[#2C4A66]", "text-white");
}

// Function to populate months dropdown
function populateMonths(currentMonth) {
  const months = [
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
  const monthDropdown = document.getElementById("statusMonthlyFilter");
  monthDropdown.innerHTML = months
    .map((month, index) => {
      const monthValue = String(index + 1).padStart(2, "0"); // Format as "01", "02", etc.
      return `<option value="${monthValue}" ${
        monthValue === currentMonth ? "selected" : ""
      }>${month}</option>`;
    })
    .join("");
}

// Function to populate years dropdown starting from 2024
function populateYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const yearDropdown = document.getElementById("statusYearlyFilter");
  yearDropdown.innerHTML = "";
  for (let year = startYear; year <= currentYear; year++) {
    yearDropdown.innerHTML += `<option value="${year}" ${
      year === currentYear ? "selected" : ""
    }>${year}</option>`;
  }
}

// Function to populate the patient records yearly filter
function populatePatientRecordsYearlyFilter() {
  const currentYear = new Date().getFullYear();
  const startYear = 2024; // Starting year for the dropdown
  const yearDropdown = document.getElementById("patientRecordsYearlyFilter");
  yearDropdown.innerHTML = ""; // Clear existing options

  for (let year = startYear; year <= currentYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearDropdown.appendChild(option);
  }

  // Set the current year as the default selected option
  yearDropdown.value = currentYear;
}

// Function to fetch years from patient records and populate the yearly filter
async function fetchAndPopulatePatientRecordsYears() {
  try {
    const response = await fetch("/api/patientRecords/years");
    if (response.ok) {
      const years = await response.json();

      // Add 2024 for testing purposes
      years.push(2024);

      const yearDropdown = document.getElementById(
        "patientRecordsYearlyFilter"
      );
      yearDropdown.innerHTML = ""; // Clear existing options

      years.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearDropdown.appendChild(option);
      });

      // Set the latest year as the default selected option
      yearDropdown.value = Math.max(...years);
    } else {
      console.error(
        "Failed to fetch patient record years:",
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching patient record years:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Fetch current month from the backend
  const response = await fetch("/api/appointments/total-status-counts");
  let currentMonth = "01"; // Default to January
  if (response.ok) {
    const data = await response.json();
    currentMonth = data.currentMonth || "01"; // Use the currentMonth from the backend
  }

  // Populate months and years dropdowns
  populateMonths(currentMonth);
  populateYears();
  populatePatientRecordsYearlyFilter();
  await fetchAndPopulatePatientRecordsYears();

  // Set default active button to "All"
  setActiveFilterButton("statusAllFilter");
  fetchAndUpdateTotals();

  const profileResponse = await fetch("/api/medicalPersonnel/profile");
  if (profileResponse.ok) {
    const personnelData = await profileResponse.json();
    displayProfileInfo(personnelData);

    const profilePictureElement = document.querySelector(".desktop-profile");
    profilePictureElement.src = personnelData.profilePicture
      ? `/uploads/${personnelData.profilePicture}`
      : "../media/logo/default-profile.png";
  }

  // Fetch and display upcoming appointments
  fetchUpcomingAppointments();

  // Fetch and display popular treatments
  fetchPopularTreatments();

  // Update patient records chart
  updatePatientRecordsChart();
});

// Add event listeners to filter buttons
document.getElementById("statusAllFilter").addEventListener("click", () => {
  setActiveFilterButton("statusAllFilter");
  fetchAndUpdateTotals("all");

  // Reset styles for month and year filters
  document
    .getElementById("statusMonthlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusMonthlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
  document
    .getElementById("statusYearlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusYearlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
});

document.getElementById("statusDailyFilter").addEventListener("click", () => {
  setActiveFilterButton("statusDailyFilter");
  fetchAndUpdateTotals("daily");

  // Reset styles for month and year filters
  document
    .getElementById("statusMonthlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusMonthlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
  document
    .getElementById("statusYearlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusYearlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
});

document.getElementById("statusWeeklyFilter").addEventListener("click", () => {
  setActiveFilterButton("statusWeeklyFilter");
  fetchAndUpdateTotals("weekly");

  // Reset styles for month and year filters
  document
    .getElementById("statusMonthlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusMonthlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
  document
    .getElementById("statusYearlyFilter")
    .classList.remove("bg-[#2C4A66]", "text-white");
  document
    .getElementById("statusYearlyFilter")
    .classList.add("bg-[#D9D9D9]", "text-black");
});

document
  .getElementById("statusMonthlyFilter")
  .addEventListener("change", () => {
    setActiveFilterButton("statusMonthlyFilter");
    document
      .getElementById("statusMonthlyFilter")
      .classList.add("bg-[#2C4A66]", "text-white");
    document
      .getElementById("statusMonthlyFilter")
      .classList.remove("bg-[#D9D9D9]", "text-black");
    document
      .getElementById("statusYearlyFilter")
      .classList.add("bg-[#2C4A66]", "text-white"); // Sync style
    document
      .getElementById("statusYearlyFilter")
      .classList.remove("bg-[#D9D9D9]", "text-black"); // Sync style
    fetchAndUpdateTotals("monthly");
  });

document.getElementById("statusYearlyFilter").addEventListener("change", () => {
  const month = document.getElementById("statusMonthlyFilter").value;
  if (month) {
    setActiveFilterButton("statusMonthlyFilter");
    document
      .getElementById("statusMonthlyFilter")
      .classList.add("bg-[#2C4A66]", "text-white"); // Sync style
    document
      .getElementById("statusMonthlyFilter")
      .classList.remove("bg-[#D9D9D9]", "text-black"); // Sync style
    document
      .getElementById("statusYearlyFilter")
      .classList.add("bg-[#2C4A66]", "text-white"); // Sync style
    document
      .getElementById("statusYearlyFilter")
      .classList.remove("bg-[#D9D9D9]", "text-black"); // Sync style
    fetchAndUpdateTotals("monthly");
  } else {
    setActiveFilterButton("statusYearlyFilter");
    document
      .getElementById("statusYearlyFilter")
      .classList.add("bg-[#2C4A66]", "text-white");
    document
      .getElementById("statusYearlyFilter")
      .classList.remove("bg-[#D9D9D9]", "text-black");
    fetchAndUpdateTotals("yearly");
  }
});

function displayProfileInfo(data) {
  document.getElementById("profile-name").innerText = `${data.firstName}`;
}

// Function to fetch and display upcoming appointments with pagination
async function fetchUpcomingAppointments() {
  try {
    const upcomingAppointmentsContainer = document
      .getElementById("upcoming-appointments")
      .querySelector("tbody");
    const paginationContainer = document.getElementById("pagination");

    // Show loading spinner
    upcomingAppointmentsContainer.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-gray-500">
          <i class="fas fa-spinner fa-spin"></i> Loading upcoming appointments...
        </td>
      </tr>`;
    paginationContainer.innerHTML = ""; // Clear pagination while loading

    const response = await fetch("/api/appointments/upcoming"); // Use your existing route
    if (response.ok) {
      const appointments = await response.json();
      setupPagination(appointments);
    } else {
      console.error(
        "Failed to fetch upcoming appointments:",
        response.statusText
      );
      upcomingAppointmentsContainer.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-red-500">Failed to load upcoming appointments.</td>
        </tr>`;
    }
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    const upcomingAppointmentsContainer = document
      .getElementById("upcoming-appointments")
      .querySelector("tbody");
    upcomingAppointmentsContainer.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-red-500">Error loading upcoming appointments.</td>
      </tr>`;
  }
}

// Function to setup pagination
function setupPagination(appointments) {
  const rowsPerPage = 3;
  const totalPages = Math.ceil(appointments.length / rowsPerPage);
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ""; // Clear existing pagination

  let currentPage = 1;

  // Function to render a specific page
  function renderPage(page) {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedAppointments = appointments.slice(start, end);

    const upcomingAppointmentsContainer = document
      .getElementById("upcoming-appointments")
      .querySelector("tbody");
    upcomingAppointmentsContainer.innerHTML = ""; // Clear existing rows

    if (paginatedAppointments.length === 0) {
      upcomingAppointmentsContainer.innerHTML = `
          <tr>
            <td colspan="3" class="text-center text-gray-500">No upcoming appointments</td>
          </tr>`;
      paginationContainer.classList.add("hidden"); //  Hide pagination container
      return;
    } else {
      paginationContainer.classList.remove("hidden"); // Show pagination container
      paginationContainer.classList.add("flex"); // Ensure flex display
    }

    paginatedAppointments.forEach((appointment) => {
      const row = `
                <tr class="bg-white shadow-sm rounded-lg p-6 mb-4">
                    <td class="px-4 py-4">
                        <p class="text-lg font-semibold">${appointment.patientName}</p>
                    </td>
                    <td class="px-4 py-4">
                        <p class="text-base text-gray-600">${appointment.preferredDate}</p>
                    </td>
                    <td class="px-4 py-4">
                        <p class="text-base text-gray-600">${appointment.preferredTime}</p>
                    </td>
                </tr>`;
      upcomingAppointmentsContainer.innerHTML += row;
    });
  }

  // Function to render pagination buttons for upcoming appointments
  function renderPagination() {
    paginationContainer.innerHTML = "";

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.innerHTML = "<";
    prevButton.className =
      "px-3 py-1 bg-gray-300 font-bold rounded disabled:opacity-50";
    if (currentPage === 1) {
      prevButton.style.display = "none"; // Hide if there's nothing to go back to
    } else {
      prevButton.style.display = "inline-block";
      prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
          renderPagination();
        }
      });
    }
    paginationContainer.appendChild(prevButton);

    // Page buttons
    const maxVisiblePages = 3;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.innerText = i;
      pageButton.className = `px-3 py-1 rounded ${
        i === currentPage ? "bg-[#2C4A66] text-white" : "bg-gray-300"
      }`;
      pageButton.addEventListener("click", () => {
        currentPage = i;
        renderPage(currentPage);
        renderPagination();
      });
      paginationContainer.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.innerHTML = ">";
    nextButton.className =
      "px-3 py-1 bg-gray-300 font-bold rounded disabled:opacity-50";
    if (currentPage === totalPages) {
      nextButton.style.display = "none"; // Hide if there's nothing to go forward to
    } else {
      nextButton.style.display = "inline-block";
      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
          renderPagination();
        }
      });
    }
    paginationContainer.appendChild(nextButton);
  }

  // Initial render
  renderPage(currentPage);
  renderPagination();
}

// Function to fetch and display popular treatments
async function fetchPopularTreatments() {
  try {
    const response = await fetch("/api/appointments/all"); // Fetch all appointments
    if (response.ok) {
      const appointments = await response.json();

      // Calculate treatment percentages
      const treatmentCounts = {};
      appointments.forEach((appointment) => {
        const treatment = appointment.treatmentType;
        if (treatment) {
          treatmentCounts[treatment] = (treatmentCounts[treatment] || 0) + 1;
        }
      });

      const totalAppointments = appointments.length;
      const treatmentPercentages = Object.entries(treatmentCounts).map(
        ([treatment, count]) => ({
          treatment,
          percentage: ((count / totalAppointments) * 100).toFixed(2),
        })
      );

      // Sort treatments by percentage in descending order
      const sortedTreatments = treatmentPercentages.sort(
        (a, b) => b.percentage - a.percentage
      );

      // Display top 3 treatments
      const popularTreatmentsContainer = document.querySelector(
        "#popular-treatments"
      );
      popularTreatmentsContainer.innerHTML = ""; // Clear existing content

      sortedTreatments.slice(0, 3).forEach((treatment, index) => {
        const rank = index + 1;
        const row = `
          <div class="bg-white shadow-sm rounded-lg p-4 mb-2 w-full flex justify-between items-center h-16">
            <p class="text-lg font-semibold">#${rank}: ${treatment.treatment}</p>
            <p class="text-lg font-semibold text-gray-600">${treatment.percentage}%</p>
          </div>`;
        popularTreatmentsContainer.innerHTML += row;
      });
    } else {
      console.error("Failed to fetch appointments:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching popular treatments:", error);
  }
}

async function fetchTotalRevenue() {
  try {
    const response = await fetch(`/api/payment/total-revenue`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById(
        "monthlyRevenue"
      ).innerText = `₱${data.revenue.toLocaleString()}`;
    } else {
      console.error("Failed to fetch total revenue:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching total revenue:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const monthRevenueFilter = document.getElementById("monthRevenueFilter");
  const monthlyRevenue = document.getElementById("monthlyRevenue");
  const monthlyRevenueIncrease = document.getElementById(
    "monthlyRevenueIncrease"
  );

  // Populate month filter with all months
  const months = [
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

  // Clear existing options to avoid duplicates
  monthRevenueFilter.innerHTML = "";

  // Fetch revenue for a specific month
  const fetchRevenue = async (month) => {
    try {
      const response = await fetch(`/api/payment/total-revenue?month=${month}`);
      const data = await response.json();
      if (response.ok) {
        return data.revenue;
      } else {
        console.error("Failed to fetch revenue:", data.error);
        return 0;
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
      return 0;
    }
  };

  // Calculate and display revenue and percentage increase
  const updateRevenue = async (selectedMonth) => {
    const currentMonthRevenue = await fetchRevenue(selectedMonth);

    // Calculate previous month
    const previousMonth =
      parseInt(selectedMonth, 10) === 1 ? 12 : parseInt(selectedMonth, 10) - 1; // Wrap around to December if January
    const previousMonthRevenue = await fetchRevenue(
      previousMonth.toString().padStart(2, "0")
    );

    // Update revenue display
    monthlyRevenue.textContent = `₱${currentMonthRevenue.toLocaleString()}`;

    // Check if the selected month is in the future
    const currentDate = new Date();
    const selectedDate = new Date(currentDate.getFullYear(), selectedMonth - 1);
    if (selectedDate > currentDate) {
      // Hide the percentage increase and set averages to 0 for future months
      monthlyRevenueIncrease.style.display = "none";
      document.getElementById("averageDailyRevenue").textContent = "₱0.00";
      document.getElementById("averageWeeklyRevenue").textContent = "₱0.00";
      return;
    }

    // Calculate percentage increase
    if (currentMonthRevenue === previousMonthRevenue) {
      // Hide the percentage increase if revenue is the same
      monthlyRevenueIncrease.style.display = "none";
    } else {
      monthlyRevenueIncrease.style.display = "block";
      if (previousMonthRevenue === 0) {
        // If there was no revenue last month, consider it a 100% increase
        monthlyRevenueIncrease.textContent = "+100.00%";
        monthlyRevenueIncrease.classList.add("text-green-700");
        monthlyRevenueIncrease.classList.remove("text-red-700");
      } else {
        const increase =
          ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100;
        monthlyRevenueIncrease.textContent = `${increase.toFixed(2)}%`;
        monthlyRevenueIncrease.classList.toggle(
          "text-green-700",
          increase >= 0
        );
        monthlyRevenueIncrease.classList.toggle("text-red-700", increase < 0);
      }
    }

    // Calculate average daily and weekly revenue
    if (currentMonthRevenue > 0) {
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        selectedMonth,
        0
      ).getDate();
      const averageDaily = currentMonthRevenue / daysInMonth;
      const averageWeekly = currentMonthRevenue / 4; // Approximate 4 weeks in a month

      // Update average daily and weekly revenue display
      document.getElementById(
        "averageDailyRevenue"
      ).textContent = `₱${averageDaily.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
      document.getElementById(
        "averageWeeklyRevenue"
      ).textContent = `₱${averageWeekly.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
    } else {
      // Set averages to 0 if revenue is 0
      document.getElementById("averageDailyRevenue").textContent = "₱0.00";
      document.getElementById("averageWeeklyRevenue").textContent = "₱0.00";
    }
  };

  // Event listener for month filter change
  monthRevenueFilter.addEventListener("change", (event) => {
    const selectedMonth = event.target.value;
    updateRevenue(selectedMonth);
  });

  // Fetch revenue for the current month on page load
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0"); // MM format
  monthRevenueFilter.value = currentMonth;
  updateRevenue(currentMonth);
});

// Function to update patient records chart
let patientRecordsChart; // Store the chart instance globally

async function updatePatientRecordsChart() {
  try {
    const year = document.getElementById("patientRecordsYearlyFilter").value;

    const response = await fetch(
      `/api/patientRecords/monthly-patient-records?year=${year}`
    );

    if (response.ok) {
      const monthlyData = await response.json();

      // Initialize all months
      const months = [
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
      const counts = monthlyData.map((data) => data.count);

      // Destroy the existing chart if it exists
      if (patientRecordsChart) {
        patientRecordsChart.destroy();
      }

      const ctx = document.getElementById("myChart");
      ctx.width = 800; // Set the canvas width to make the chart wider
      ctx.height = 250; // Set the canvas height to make the chart smaller

      // Create a new chart instance
      patientRecordsChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: months,
          datasets: [
            {
              label: "Patient Records",
              data: counts,
              borderWidth: 2,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 14, family: "Arial", weight: "bold" },
                color: "#333",
              },
            },
            x: {
              ticks: {
                font: { size: 10, family: "Arial", weight: "bold" },
                color: "#333",
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                font: { size: 16, family: "Arial", weight: "bold" },
                color: "#333",
              },
            },
          },
        },
      });
    } else {
      console.error(
        "Failed to fetch monthly patient records:",
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching monthly patient records:", error);
  }
}

document
  .getElementById("patientRecordsYearlyFilter")
  .addEventListener("change", updatePatientRecordsChart);

document.addEventListener("DOMContentLoaded", () => {
  const monthRevenueFilter = document.getElementById("monthRevenueFilter");
  const monthlyRevenue = document.getElementById("monthlyRevenue");
  const monthlyRevenueIncrease = document.getElementById(
    "monthlyRevenueIncrease"
  );

  // Populate month filter with all months
  const months = [
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
  months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = (index + 1).toString().padStart(2, "0"); // Month in MM format
    option.textContent = month;
    monthRevenueFilter.appendChild(option);
  });

  // Fetch revenue for a specific month
  const fetchRevenue = async (month) => {
    try {
      const response = await fetch(`/api/payment/total-revenue?month=${month}`);
      const data = await response.json();
      if (response.ok) {
        return data.revenue;
      } else {
        console.error("Failed to fetch revenue:", data.error);
        return 0;
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
      return 0;
    }
  };

  // Calculate and display revenue and percentage increase
  const updateRevenue = async (selectedMonth) => {
    const currentMonthRevenue = await fetchRevenue(selectedMonth);

    // Calculate previous month
    const previousMonth =
      parseInt(selectedMonth, 10) === 1 ? 12 : parseInt(selectedMonth, 10) - 1; // Wrap around to December if January
    const previousMonthRevenue = await fetchRevenue(
      previousMonth.toString().padStart(2, "0")
    );

    // Update revenue display
    monthlyRevenue.textContent = `₱${currentMonthRevenue.toLocaleString()}`;

    // Check if the selected month is in the future
    const currentDate = new Date();
    const selectedDate = new Date(currentDate.getFullYear(), selectedMonth - 1);
    if (selectedDate > currentDate) {
      // Hide the percentage increase and set averages to 0 for future months
      monthlyRevenueIncrease.style.display = "none";
      document.getElementById("averageDailyRevenue").textContent = "₱0.00";
      document.getElementById("averageWeeklyRevenue").textContent = "₱0.00";
      return;
    }

    // Calculate percentage increase
    if (currentMonthRevenue === previousMonthRevenue) {
      // Hide the percentage increase if revenue is the same
      monthlyRevenueIncrease.style.display = "none";
    } else {
      monthlyRevenueIncrease.style.display = "block";
      if (previousMonthRevenue === 0) {
        // If there was no revenue last month, consider it a 100% increase
        monthlyRevenueIncrease.textContent = "+100.00%";
        monthlyRevenueIncrease.classList.add("text-green-700");
        monthlyRevenueIncrease.classList.remove("text-red-700");
      } else {
        const increase =
          ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100;
        monthlyRevenueIncrease.textContent = `${increase.toFixed(2)}%`;
        monthlyRevenueIncrease.classList.toggle(
          "text-green-700",
          increase >= 0
        );
        monthlyRevenueIncrease.classList.toggle("text-red-700", increase < 0);
      }
    }

    // Calculate average daily and weekly revenue
    if (currentMonthRevenue > 0) {
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        selectedMonth,
        0
      ).getDate();
      const averageDaily = currentMonthRevenue / daysInMonth;
      const averageWeekly = currentMonthRevenue / 4; // Approximate 4 weeks in a month

      // Update average daily and weekly revenue display
      document.getElementById(
        "averageDailyRevenue"
      ).textContent = `₱${averageDaily.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
      document.getElementById(
        "averageWeeklyRevenue"
      ).textContent = `₱${averageWeekly.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
    } else {
      // Set averages to 0 if revenue is 0
      document.getElementById("averageDailyRevenue").textContent = "₱0.00";
      document.getElementById("averageWeeklyRevenue").textContent = "₱0.00";
    }
  };

  // Event listener for month filter change
  monthRevenueFilter.addEventListener("change", (event) => {
    const selectedMonth = event.target.value;
    updateRevenue(selectedMonth);
  });

  // Fetch revenue for the current month on page load
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0"); // MM format
  monthRevenueFilter.value = currentMonth;
  updateRevenue(currentMonth);
  updatePatientRecordsChart();
});
