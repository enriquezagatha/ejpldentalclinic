const bookingRecords = {};
    
const savedBookings = JSON.parse(localStorage.getItem('bookingRecords'));
if (savedBookings) {
    Object.assign(bookingRecords, savedBookings);
}
    
// Navigate to the previous step and save data
function goToAppointmentBack() {
    localStorage.setItem('isNavigating', 'true'); // Set flag for navigation
    saveFormData();
    window.location.href = "typeofpatient.html";
}
    
// Navigate to the next step and save data
function goToAppointmentNext() {
    localStorage.setItem('isNavigating', 'true'); // Set flag for navigation
    saveFormData();
    window.location.href = "step1appointment.html";
}
    
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
    
function saveFormData() {
    const preferredDate = document.querySelector('.date-input')?.value || '';
    const preferredTime = document.querySelector('.time-select')?.value || '';
    const treatmentType = document.querySelector('.typeoftreatment-select')?.value || '';
    const selectedOption = document.querySelector('.typeoftreatment-select')?.selectedOptions[0];
    const treatmentPrice = selectedOption ? selectedOption.dataset.price : "0";

    localStorage.setItem('preferredDate', preferredDate);
    localStorage.setItem('preferredTime', preferredTime);
    localStorage.setItem('treatmentType', treatmentType);
    localStorage.setItem('treatmentPrice', treatmentPrice);
}

function loadFormData() {
    const isNavigating = localStorage.getItem('isNavigating');

    if (isNavigating) {
        const preferredDate = localStorage.getItem('preferredDate');
        const preferredTime = localStorage.getItem('preferredTime');
        const treatmentType = localStorage.getItem('treatmentType');
        const treatmentPrice = localStorage.getItem('treatmentPrice'); // ✅ Retrieve stored price

        if (preferredDate) {
            const [year, month, day] = preferredDate.split('-');
            const monthName = monthNames[parseInt(month, 10) - 1];
            const formattedDate = `${monthName} ${day}, ${year}`;

            const dateInput = document.querySelector('.date-input');
            if (dateInput) {
                dateInput.value = preferredDate;
            }

            const datePlaceholder = document.querySelector('.date-placeholder');
            if (datePlaceholder) {
                datePlaceholder.textContent = formattedDate;
            }
        }

        if (preferredTime) {
            const timeSelect = document.querySelector('.time-select');
            if (timeSelect) {
                if (timeSelect.tagName === 'INPUT' && timeSelect.type === 'time') {
                    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(preferredTime)) {
                        timeSelect.value = preferredTime;
                    } else {
                        console.error('Preferred time format is incorrect.');
                    }
                } else if (timeSelect.tagName === 'SELECT') {
                    timeSelect.querySelectorAll('option').forEach(option => {
                        if (option.value === preferredTime) {
                            option.selected = true;
                        }
                    });
                } else {
                    console.error('Unsupported element type for time input.');
                }
            }
        }

        if (treatmentType) {
            const treatmentElement = document.querySelector('.typeoftreatment-select');
            if (treatmentElement) {
                if (treatmentElement.tagName.toLowerCase() === 'select') {
                    treatmentElement.querySelectorAll('option').forEach(option => {
                        if (option.value === treatmentType) {
                            option.selected = true;
                        }
                    });
                } else if (treatmentElement.tagName.toLowerCase() === 'input') {
                    treatmentElement.value = treatmentType;
                }
            }
        }

        // ✅ Fix: Properly update treatment price input
        const treatmentPriceInput = document.getElementById("treatment-price");
        if (treatmentPriceInput) {
            treatmentPriceInput.value = treatmentPrice ? `₱${treatmentPrice}` : "";
        }

        localStorage.removeItem('isNavigating');
    } else {
        document.querySelector('.date-input').value = '';
        document.querySelector('.time-select').value = '';
        document.querySelector('.typeoftreatment-select').value = '';
        const treatmentPriceInput = document.getElementById("treatment-price");
        if (treatmentPriceInput) {
            treatmentPriceInput.value = "";
        }
    }
}
    
function populateTimeOptions(selectedDate = null, selectedTime = null) {
    const timeSelect = document.querySelector('.time-select');
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="" disabled selected>Preferred Time</option>';
        let timeSlots = [];
        
        if (selectedDate) {
            const selectedDateObj = new Date(selectedDate);
            const dayOfWeek = selectedDateObj.getDay();
        
            if (dayOfWeek === 1) { // Monday
                timeSlots = generateTimeSlots(18, 24); // 6 PM - 12 AM
            } else if (dayOfWeek === 6) { // Saturday
                timeSlots = [
                    ...generateTimeSlots(0, 2),   // 12 AM - 2 AM
                    ...generateTimeSlots(8, 12),  // 8 AM - 12 PM
                    ...generateTimeSlots(14, 24)  // 2 PM - 12 AM
                ];
            } else { // Tuesday - Friday & Sunday
                timeSlots = [
                    ...generateTimeSlots(0, 2),   // 12 AM - 2 AM
                    ...generateTimeSlots(14, 24)  // 2 PM - 12 AM
                ];
            }
        }
        
        timeSlots.forEach(slot => {
        const bookedCount = bookingRecords[slot] || 0;
            if (bookedCount < 1) { // Limit to only 1 patient per slot
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            }
        });
    }
}
        
function generateTimeSlots(startHour, endHour) {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
        const startTime = formatTime(hour);
        const endTime = formatTime(hour + 1);
        slots.push(`${startTime} - ${endTime}`);
    }
    return slots;
}
        
function formatTime(hour) {
    if (hour === 24) return "12:00 AM"; // Midnight case
    if (hour === 12) return "12:00 PM"; // Noon case
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 24-hour format to 12-hour format
    return `${formattedHour}:00 ${period}`;
}                  
    
document.addEventListener('DOMContentLoaded', function () {
    loadFormData();
    populateTimeOptions();
    
    const calendarIcon = document.querySelector('.calendar-icon');
    if (calendarIcon) {
        calendarIcon.addEventListener('click', function () {
            const dateInput = document.querySelector('.date-input');
            if (dateInput && !dateInput.disabled) { // Check if the input is not disabled
                dateInput.showPicker();
            }
        });
    }
    
    const dateInputField = document.getElementById('dateInput');
    if (dateInputField) {
        const today = new Date();
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 7);

        const formatDate = (date) => date.toISOString().split('T')[0];
    
        dateInputField.min = formatDate(today);
        dateInputField.max = formatDate(maxDate);

        const previouslySelectedDate = localStorage.getItem('preferredDate');
        if (previouslySelectedDate) {
            const storedDate = new Date(previouslySelectedDate);
            if (storedDate >= today && storedDate <= maxDate) {
                dateInputField.value = previouslySelectedDate;
            }else {
                // If not, reset the value to ensure the user selects a valid date
                dateInputField.value = '';
            }
        }
    } 
    
    document.querySelector('.date-input').addEventListener('change', function () {
        const dateInputValue = this.value;
        const selectedTime = document.querySelector('.time-select')?.value; // Get the currently selected time
        populateTimeOptions(dateInputValue, selectedTime); // Pass the selected time
            
        const [year, month, day] = dateInputValue.split('-');
        const monthName = monthNames[parseInt(month, 10) - 1];
        const formattedDate = `${monthName} ${day}, ${year}`;
            
        const datePlaceholder = document.querySelector('.date-placeholder');
        if (datePlaceholder && datePlaceholder.tagName === 'INPUT') {
            datePlaceholder.placeholder = formattedDate;
        } else if (datePlaceholder) {
            datePlaceholder.textContent = formattedDate;
        }
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    const treatmentSelect = document.getElementById("treatment-select");
    const treatmentPrice = document.getElementById("treatment-price"); // This is an input field

    try {
        const response = await fetch("http://localhost:3000/api/treatments");
        const treatments = await response.json();

        treatments.forEach(treatment => {
            const option = document.createElement("option");
            option.value = treatment.name;
            option.dataset.price = treatment.price; // Store price in dataset
            option.textContent = treatment.name;
            treatmentSelect.appendChild(option);
        });

        // Update price when selection changes
        treatmentSelect.addEventListener("change", function () {
            const selectedOption = treatmentSelect.options[treatmentSelect.selectedIndex];
            let price = selectedOption.dataset.price || "0";

            // Ensure both numbers in the range get the peso sign
            if (price.includes("-")) {
                const [minPrice, maxPrice] = price.split("-");
                price = `₱${minPrice.trim()} - ₱${maxPrice.trim()}`;
            } else {
                price = `₱${price}`;
            }

            treatmentPrice.value = price; // Set properly formatted price
        });

    } catch (error) {
        console.error("Error fetching treatments:", error);
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('schedule-form');
    if (form) {
        form.reset();
    } else {
        console.error("Form with ID 'schedule-form' not found.");
    }
});

function updateCalendarIcon() {
    const calendarIcon = document.querySelector('.calendar-icon');
    if (!calendarIcon) return;

    const dateInput = document.querySelector('.date-input');
    if (!dateInput) return;

    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0]; // Default to today if empty
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    let totalSlots = 0, bookedSlots = 0;

    // Determine available slots based on the day
    if (dayOfWeek === 1) { // Monday
        totalSlots = generateTimeSlots(18, 24).length;
    } else if (dayOfWeek === 6) { // Saturday
        totalSlots = generateTimeSlots(0, 2).length + generateTimeSlots(8, 12).length + generateTimeSlots(14, 24).length;
    } else { // Tuesday - Friday & Sunday
        totalSlots = generateTimeSlots(0, 2).length + generateTimeSlots(14, 24).length;
    }

    // Count booked slots for the selected date
    bookedSlots = Object.values(bookingRecords).filter(record => record.date === selectedDate).length;

    const availableSlots = totalSlots - bookedSlots;
    
    // Update calendar icon text
    calendarIcon.textContent = `📅 ${availableSlots} slots available`;
}

// Call this function when the document loads and when a date is selected
document.addEventListener("DOMContentLoaded", function () {
    updateCalendarIcon();

    const dateInput = document.querySelector('.date-input');
    if (dateInput) {
        dateInput.addEventListener('change', updateCalendarIcon);
    }
});