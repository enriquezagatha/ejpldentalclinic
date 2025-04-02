const bookingRecords = {};
    
        const savedBookings = JSON.parse(localStorage.getItem('bookingRecords'));
        if (savedBookings) {
            Object.assign(bookingRecords, savedBookings);
        }
    
        // Navigate to the previous step and save data
        function goToAppointmentBack() {
            localStorage.setItem('isNavigating', 'true'); // Set flag for navigation
            saveFormData();
            window.location.href = "existingpatient.html";
        }
    
        // Navigate to the next step and save data
        function goToAppointmentNext() {
            localStorage.setItem('isNavigating', 'true'); // Set flag for navigation
            saveFormData();
            window.location.href = "existing-step3appointment.html";
        }
    
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    
        function saveFormData() {
            const preferredDate = document.querySelector('.date-input')?.value || '';
            const preferredTime = document.querySelector('.time-select')?.value || '';
            const treatmentType = document.querySelector('.typeoftreatment-select')?.value || '';
    
            localStorage.setItem('preferredDate', preferredDate);
            localStorage.setItem('preferredTime', preferredTime);
            localStorage.setItem('treatmentType', treatmentType);
        }
    
        function loadFormData() {
            const isNavigating = localStorage.getItem('isNavigating');
    
            if (isNavigating) {
                const preferredDate = localStorage.getItem('preferredDate');
                const preferredTime = localStorage.getItem('preferredTime');
                const treatmentType = localStorage.getItem('treatmentType');
    
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
    
                localStorage.removeItem('isNavigating');
            } else {
                document.querySelector('.date-input').value = '';
                document.querySelector('.time-select').value = '';
                document.querySelector('.typeoftreatment-select').value = '';
            }
        }
    
        function populateTimeOptions(selectedDate = null, selectedTime = null) {
            const timeSelect = document.querySelector('.time-select');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="" disabled selected>Preferred Time</option>';
                let timeSlots;
    
                if (selectedDate) {
                    const today = new Date();
                    const selectedDateObj = new Date(selectedDate);
                    const isToday = selectedDateObj.toDateString() === today.toDateString();
                    const isMonday = selectedDateObj.getDay() === 1;
    
                    if (isMonday) {
                        timeSlots = ['06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'];
                    } else {
                        timeSlots = (isToday) ?
                            ['02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'] :
                            ['02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'];
                    }
    
                    if (isToday) {
                        const currentHour = today.getHours();
                        const currentMinutes = today.getMinutes();
                        const currentTotalMinutes = currentHour * 60 + currentMinutes;
    
                        timeSlots = timeSlots.filter(time => {
                            const [hour, minute] = time.split(':');
                            const period = minute.split(' ')[1];
                            const timeHour = parseInt(hour) + (period === 'PM' ? 12 : 0);
                            const timeMinutes = parseInt(minute) === 0 ? (timeHour * 60) : (timeHour * 60 + 30); // Assuming all slots are on the hour or half hour
                            return timeMinutes >= currentTotalMinutes;
                        });
                    }
    
                    if (selectedTime) {
                        const selectedTimeParts = selectedTime.split(' ');
                        const selectedHour = parseInt(selectedTimeParts[0].split(':')[0]) + (selectedTimeParts[1] === 'PM' ? 12 : 0);
                        const selectedMinutes = parseInt(selectedTimeParts[0].split(':')[1]);
                        const selectedTotalMinutes = selectedHour * 60 + selectedMinutes;
    
                        timeSlots = timeSlots.filter(time => {
                            const [hour, minute] = time.split(':');
                            const period = minute.split(' ')[1];
                            const timeInMinutes = (parseInt(hour) % 12) * 60 + (period === 'PM' ? 12 * 60 : 0) + parseInt(minute);
                            return timeInMinutes >= selectedTotalMinutes;
                        });
                    }
                } else {
                    timeSlots = ['02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'];
                }
    
                timeSlots.forEach(time => {
                    const bookedCount = bookingRecords[time] || 0;
                    if (bookedCount < 2) {
                        const option = document.createElement('option');
                        option.value = time;
                        option.textContent = time;
                        timeSelect.appendChild(option);
                    }
                });
            }
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
            const treatmentPrice = document.getElementById("treatment-price");

            try {
                const response = await fetch("http://localhost:3000/api/treatments");
                const treatments = await response.json();

                treatments.forEach(treatment => {
                    const option = document.createElement("option");
                    option.value = treatment.name;
                    option.dataset.price = treatment.price; // Store price in dataset
                    option.textContent = `${treatment.name}`;
                    treatmentSelect.appendChild(option);
                });

                // Update price when selection changes
                treatmentSelect.addEventListener("change", function () {
                    const selectedOption = treatmentSelect.options[treatmentSelect.selectedIndex];
                    const price = selectedOption.dataset.price || "0";
                    treatmentPrice.textContent = `Price: ₱${parseFloat(price).toFixed(2)}`;
                });

            } catch (error) {
                console.error("Error fetching treatments:", error);
            }
        });


        window.onload = function() {
            document.getElementById('schedule-form').reset();
        };