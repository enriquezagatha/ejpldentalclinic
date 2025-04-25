fetch("../components/footer.html")
  .then((response) => response.text())
  .then((footerHTML) => {
    const footerContainer = document.getElementById("footer-container");
    if (footerContainer) {
      footerContainer.innerHTML = footerHTML;
      updateCopyrightYear();
      updateFooterLinks();
      updateLogoRedirect();
    } else {
      console.error("Footer container not found in the DOM.");
    }
  })
  .catch((error) => {
    console.error("Failed to load footer:", error);
  });

function updateCopyrightYear() {
  const currentYear = new Date().getFullYear();
  const yearElement = document.getElementById("copyright-year");
  if (yearElement) {
    yearElement.textContent = currentYear;
  } else {
    console.error("Copyright year element not found in the DOM.");
  }
}

function updateFooterLinks() {
  const currentPath = window.location.pathname;

  const homeLink = document.getElementById("footerHomeLink");
  if (homeLink && currentPath.includes("/Patient/")) {
    homeLink.href = "../Patient/patient-home.html";
  }

  const aboutUsLink = document.getElementById("footerAboutUsLink");
  if (aboutUsLink && currentPath.includes("/Patient/")) {
    aboutUsLink.href = "../Patient/patient-aboutus.html";
  }

  const servicesLink = document.getElementById("footerServicesLink");
  if (servicesLink && currentPath.includes("/Patient/")) {
    servicesLink.href = "../Patient/patient-services.html";
  }

  const doctorsLink = document.getElementById("footerDoctorsLink");
  if (doctorsLink && currentPath.includes("/Patient/")) {
    doctorsLink.href = "../Patient/patient-doctors.html";
  }
}

function updateLogoRedirect() {
  const logo = document.getElementById("footerHomeLogo");
  if (logo) {
    const currentPath = window.location.pathname;
    if (currentPath.includes("/Patient/")) {
      logo.setAttribute(
        "onclick",
        "window.location.href='../Patient/patient-home.html';"
      );
    }
  } else {
    console.error("Logo element not found in the footer.");
  }
}
