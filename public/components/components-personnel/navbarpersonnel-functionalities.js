document.addEventListener("DOMContentLoaded", async () => {
  try {
    const profileResponse = await fetch("/api/medicalPersonnel/profile");
    if (profileResponse.ok) {
      const personnelData = await profileResponse.json();
      displayProfileInfo(personnelData);

      // Set the profile picture if available
      const profilePictureElement = document.querySelector(".desktop-profile");
      profilePictureElement.src = personnelData.profilePicture
        ? `/uploads/${personnelData.profilePicture}`
        : "../media/logo/default-profile.png";
    } else {
      console.error(
        "Failed to fetch profile data:",
        profileResponse.statusText
      );
      setDefaultProfilePicture();
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
    setDefaultProfilePicture();
  }
});

function setDefaultProfilePicture() {
  const profilePictureElement = document.querySelector(".desktop-profile");
  profilePictureElement.src = "../media/logo/default-profile.png";
}

// Close mobile dropdown when clicking outside
document.addEventListener("click", function (event) {
  const mobileDropdown = document.getElementById("mobile-profile-dropdown");
  const profileContainer = document.getElementById("profile-container");

  if (
    !mobileDropdown.contains(event.target) &&
    !profileContainer.contains(event.target)
  ) {
    mobileDropdown.classList.add("hidden");
  }
});

function toggleMobileDropdown() {
  const mobileDropdown = document.getElementById("mobile-profile-dropdown");
  mobileDropdown.classList.toggle("hidden");
}

document
  .getElementById("profile-container")
  .addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent triggering the outside click listener
    toggleMobileDropdown();
  });

// Close the dropdown when clicking outside
document.addEventListener("click", function () {
  const mobileDropdown = document.getElementById("mobile-profile-dropdown");
  if (!mobileDropdown.classList.contains("hidden")) {
    mobileDropdown.classList.add("hidden");
  }
});

function displayProfileInfo(data) {
  const birthday = new Date(data.birthday);

  // Check if the date is valid
  if (isNaN(birthday.getTime())) {
    console.error("Invalid birthday format");
    return;
  }

  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedBirthday = birthday.toLocaleDateString(undefined, options);

  document.getElementById("profile-name").innerText = `${data.firstName}`;
  document.getElementById(
    "full-name"
  ).innerText = `${data.firstName} ${data.lastName}`;
  document.getElementById("birthday-info").innerText = `${formattedBirthday}`;
  document.getElementById("email-info").innerText = `${data.email}`;
}

const notificationBell = document.getElementById("notification-bell");
const notificationDropdown = document.getElementById("notification-dropdown");
const mobileNotificationDropdown = document.getElementById(
  "mobile-notification-dropdown"
);

notificationBell.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent closing when clicking the bell
  if (window.innerWidth >= 1024) {
    // Show desktop notification dropdown
    notificationDropdown.classList.toggle("hidden");
    if (!notificationDropdown.classList.contains("hidden")) {
      notificationDropdown.classList.add("block");
    } else {
      notificationDropdown.classList.remove("block");
    }
    mobileNotificationDropdown.classList.add("hidden");
    mobileNotificationDropdown.classList.remove("block");
  } else {
    // Show mobile notification dropdown
    mobileNotificationDropdown.classList.toggle("hidden");
    if (!mobileNotificationDropdown.classList.contains("hidden")) {
      mobileNotificationDropdown.classList.add("block");
    } else {
      mobileNotificationDropdown.classList.remove("block");
    }
    notificationDropdown.classList.add("hidden");
    notificationDropdown.classList.remove("block");
  }
});

document.addEventListener("click", (event) => {
  if (!notificationBell.contains(event.target)) {
    // Close both dropdowns when clicking outside
    notificationDropdown.classList.add("hidden");
    notificationDropdown.classList.remove("block");
    mobileNotificationDropdown.classList.add("hidden");
    mobileNotificationDropdown.classList.remove("block");
  }
});

window.addEventListener("resize", () => {
  // Ensure only the appropriate dropdown is visible on resize
  if (window.innerWidth >= 1024) {
    mobileNotificationDropdown.classList.add("hidden");
    mobileNotificationDropdown.classList.remove("block");
  } else {
    notificationDropdown.classList.add("hidden");
    notificationDropdown.classList.remove("block");
  }
});
