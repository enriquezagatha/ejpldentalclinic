// Get all patients who have at least one completed appointment
exports.getAllPatientsWithCompletedAppointments = async (req, res) => {
    try {
        // Find all completed appointments and extract patient details
        const completedAppointments = await Appointment.find(
            { status: 'Completed' }, // Filter for completed appointments
            'firstName lastName emailAddress age gender contactNumber'
        );

        // Use a Map to ensure unique patients
        const uniquePatients = new Map();

        completedAppointments.forEach(appointment => {
            const patientKey = `${appointment.firstName} ${appointment.lastName}`;
            if (!uniquePatients.has(patientKey)) {
                uniquePatients.set(patientKey, {
                    firstName: appointment.firstName,
                    lastName: appointment.lastName,
                    emailAddress: appointment.emailAddress,
                    age: appointment.age,
                    gender: appointment.gender,
                    contactNumber: appointment.contactNumber,
                    address: appointment.address,
                    emergencyContact: appointment.emergencyContact,
                    emergencyContactNumber: appointment.emergencyContactNumber,
                    emergencyContactRelationship: appointment.emergencyContactRelationship,
                    selectedHistory: appointment.selectedHistory,
                    treatments: [],
                    uploadedFiles: [],
                });
            }
        });

        res.status(200).json(Array.from(uniquePatients.values()));
    } catch (error) {
        console.error('Error fetching patients with completed appointments:', error);
        res.status(500).json({ message: 'Failed to fetch patient records' });
    }
};


router.get('/patients-with-completed-appointments', patientController.getAllPatientsWithCompletedAppointments);