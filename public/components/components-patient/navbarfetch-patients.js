fetch("../components/components-patient/navbar-patients.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar-container").innerHTML = data;

    const mobileOpenButton = document.getElementById("mobile-open-button");
    const mobileMenu = document.getElementById("mobile-menu");

    mobileOpenButton.addEventListener("click", () => {
      const isHidden = mobileMenu.classList.contains("opacity-0");
      mobileMenu.classList.toggle("opacity-0", !isHidden);
      mobileMenu.classList.toggle("pointer-events-none", !isHidden);
      mobileMenu.classList.toggle("translate-y-0", isHidden);
      mobileMenu.classList.toggle("-translate-y-4", !isHidden);
      mobileOpenButton.innerHTML = isHidden ? "&#10005;" : "&#9776;";
    });

    document.addEventListener("click", (event) => {
      if (
        !mobileMenu.contains(event.target) &&
        !mobileOpenButton.contains(event.target)
      ) {
        mobileMenu.classList.add("opacity-0");
        mobileMenu.classList.add("pointer-events-none");
        mobileMenu.classList.remove("translate-y-0");
        mobileMenu.classList.add("-translate-y-4");
        mobileOpenButton.innerHTML = "&#9776;";
      }
    });

    function toggleDropdown(id) {
      const dropdown = document.getElementById(id);
      dropdown.classList.toggle("hidden");
    }

    window.toggleDropdown = toggleDropdown;

    function displayProfileInfo(data) {
      const profileName = document.getElementById("profile-name");
      const mobileProfileName = document.getElementById("mobile-profile-name");
      const profileImage = document.querySelector(".desktop-profile");
      const mobileProfileImage = document.querySelector(".mobile-profile");
      const firstName = data.firstName || "Guest";
      const profilePic = data.profilePicture
        ? `/uploads/${data.profilePicture}`
        : "../media/logo/default-profile.png";

      if (profileName) profileName.innerText = firstName;
      if (mobileProfileName) mobileProfileName.innerText = firstName;
      if (profileImage) profileImage.src = profilePic;
      if (mobileProfileImage) mobileProfileImage.src = profilePic;
    }

    async function fetchProfile() {
      const response = await fetch("/api/patient/profile");
      if (response.ok) {
        const data = await response.json();
        displayProfileInfo(data);
      }
    }

    const profileName = document.getElementById("profile-name");
    const mobileProfileName = document.getElementById("mobile-profile-name");
    const profileImage = document.querySelector(".desktop-profile");
    const mobileProfileImage = document.querySelector(".mobile-profile");
    const userName = sessionStorage.getItem("firstName") || "Loading...";
    const defaultPic = "../media/logo/default-profile.png";

    if (profileName) profileName.textContent = userName;
    if (mobileProfileName) mobileProfileName.textContent = userName;
    if (profileImage) profileImage.src = defaultPic;
    if (mobileProfileImage) mobileProfileImage.src = defaultPic;

    fetchProfile();

    // Notification Bell Dropdown Script
    const notificationBell = document.getElementById("notification-bell");
    const notificationDropdown = document.getElementById(
      "notification-dropdown"
    );

    notificationBell.addEventListener("click", () => {
      notificationDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (
        !notificationBell.contains(event.target) &&
        !notificationDropdown.contains(event.target)
      ) {
        notificationDropdown.classList.add("hidden");
      }
    });

    // Mobile Notification Bell Dropdown Script
    const mobileNotificationBell = document.getElementById(
      "mobile-notification-bell"
    );
    const mobileNotificationDropdown = document.getElementById(
      "mobile-notification-dropdown"
    );

    mobileNotificationBell.addEventListener("click", () => {
      mobileNotificationDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (
        !mobileNotificationBell.contains(event.target) &&
        !mobileNotificationDropdown.contains(event.target)
      ) {
        mobileNotificationDropdown.classList.add("hidden");
      }
    });

    // Ensure mobile-notification-dropdown is hidden on non-mobile screens
    window.addEventListener("resize", () => {
      const mobileNotificationDropdown = document.getElementById(
        "mobile-notification-dropdown"
      );
      if (window.innerWidth >= 1024) {
        mobileNotificationDropdown.classList.add("hidden");
      }
    });
  });
