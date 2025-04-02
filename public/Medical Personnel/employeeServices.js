const SERVICE_API_URL = 'http://localhost:3000/api/services'; // Adjust if necessary

// Load services when page loads
document.addEventListener('DOMContentLoaded', fetchServices);

function fetchServices() {
    fetch(SERVICE_API_URL)
        .then(response => response.json())
        .then(services => {
            let rows = '';
            services.forEach(service => {
                rows += `
                    <tr>
                        <td>${service.name}</td>
                        <td>${service.description}</td>
                        <td><img src="${service.image}" alt="Service Image" width="80"></td>
                        <td>
                            <button onclick="editService('${service._id}', '${service.name}', '${service.description}', '${service.image}')">Edit</button>
                            <button onclick="deleteService('${service._id}')">Delete</button>
                        </td>
                    </tr>`;
            });
            document.getElementById('service-table-body').innerHTML = rows;
        })
        .catch(error => {
            console.error('Error fetching services:', error);
            alert('Failed to load services. Please try again.');
        });
        
}

// Open modal for adding a new service
document.getElementById('open-service-modal-btn').addEventListener('click', () => {
    document.getElementById('service-id').value = ''; // Reset hidden input
    document.getElementById('service-name').value = '';
    document.getElementById('service-desc').value = '';
    document.getElementById('service-modal-title').textContent = 'Add New Service';
    document.getElementById('save-service-btn').textContent = 'Add Service';
    document.getElementById('service-modal').style.display = 'block';
});

// Close modal
document.getElementById('close-service-modal-btn').addEventListener('click', () => {
    document.getElementById('service-modal').style.display = 'none';
});

// Handle add/update service
document.getElementById('save-service-btn').addEventListener('click', async () => {
    const id = document.getElementById('service-id').value;
    const name = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-desc').value.trim();
    const imageInput = document.getElementById('service-image').files[0];

    if (!name || !description) {
        alert('Please enter service name and description.');
        return;
    }

    try {
        // Fetch existing services to check for duplicate names
        const response = await fetch(SERVICE_API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch services.');
        }

        const services = await response.json();
        const isDuplicate = services.some(service => service.name.toLowerCase() === name.toLowerCase() && service._id !== id);

        if (isDuplicate) {
            alert('A service with this name already exists. Please choose a different name.');
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        if (imageInput) {
            formData.append('image', imageInput);
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${SERVICE_API_URL}/${id}` : SERVICE_API_URL;

        // Send request to API
        const saveResponse = await fetch(url, {
            method,
            body: formData,
        });

        if (!saveResponse.ok) {
            throw new Error('Failed to save service.');
        }

        // Reset form
        resetServiceForm();
        document.getElementById('service-modal').style.display = 'none';
        fetchServices();
        alert(id ? 'Service updated successfully' : 'Service added successfully');

    } catch (error) {
        console.error('Error saving service:', error);
        alert('Error saving service. Please try again.');
    }
});

// Edit service
function editService(id, name, description, image) {
    document.getElementById('service-id').value = id;
    document.getElementById('service-name').value = name;
    document.getElementById('service-desc').value = description;
    document.getElementById('service-modal-title').textContent = 'Edit Service';
    document.getElementById('save-service-btn').textContent = 'Update Service';
    document.getElementById('service-modal').style.display = 'block';
}

// Delete service
function deleteService(id) {
    if (confirm('Are you sure you want to delete this service?')) {
        fetch(`${SERVICE_API_URL}/${id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete service.');
                }
                fetchServices();
                alert("Service deleted successfully!");
            })
            .catch(error => {
                console.error('Error deleting service:', error);
                alert("Error deleting service. Please try again.");
            });
    }
}

//Reset form
function resetServiceForm(){
    document.getElementById('service-id').value = '';
    document.getElementById('service-name').value = '';
    document.getElementById('service-desc').value = '';
    document.getElementById('service-image').value = '';
}