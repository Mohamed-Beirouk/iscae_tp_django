// API Base URL - adjust if your Django server runs on a different port
const API_BASE_URL = 'http://localhost:8000';

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    if (accessToken) {
        showAuthenticatedUI();
        loadUserProfile();
        loadDonationHistory();
    } else {
        showUnauthenticatedUI();
    }
    loadLeaderboard();
    loadDonationCenters();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'block';
    });

    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        document.getElementById('registerModal').style.display = 'block';
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('donationForm').addEventListener('submit', handleDonationSubmit);
    document.getElementById('showDonationFormBtn').addEventListener('click', () => {
        document.getElementById('donationModal').style.display = 'block';
    });
}

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (accessToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config = { ...defaultOptions, ...options };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (response.status === 401 && accessToken) {
            // Token expired, try to refresh
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                // Retry the request with new token
                config.headers['Authorization'] = `Bearer ${accessToken}`;
                const retryResponse = await fetch(url, config);
                return await retryResponse.json();
            }
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function refreshAccessToken() {
    if (!refreshToken) {
        logout();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();
        if (response.ok && data.access) {
            accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }

    logout();
    return false;
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/api/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            accessToken = data.access;
            refreshToken = data.refresh;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('loginForm').reset();

            showAuthenticatedUI();
            loadUserProfile();
            loadDonationHistory();
        } else {
            errorDiv.textContent = data.detail || 'Login failed. Please check your credentials.';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.classList.add('show');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('registerError');

    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        tel: parseInt(document.getElementById('tel').value),
        password: document.getElementById('password').value,
        groupe_sanguin: document.getElementById('groupeSanguin').value || null,
        date_naissance: document.getElementById('dateNaissance').value || null,
        location: document.getElementById('location').value || null,
        nni: document.getElementById('nni').value || null,
        maladie: document.getElementById('maladie').value || null,
        antecedents: document.getElementById('antecedents').value || null,
        bio: document.getElementById('bio').value || null,
        pret_pour_don: document.getElementById('pretPourDon').checked,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
            document.getElementById('registerModal').style.display = 'none';
            document.getElementById('registerForm').reset();
            alert('Registration successful! Please login.');
        } else {
            errorDiv.textContent = data.error || 'Registration failed. Please try again.';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.classList.add('show');
    }
}

function logout() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    showUnauthenticatedUI();
    document.getElementById('userProfile').style.display = 'none';
    document.getElementById('donationHistory').style.display = 'none';
}

function showAuthenticatedUI() {
    document.getElementById('showLoginBtn').style.display = 'none';
    document.getElementById('showRegisterBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';
    document.getElementById('userProfile').style.display = 'block';
    document.getElementById('donationHistory').style.display = 'block';
}

function showUnauthenticatedUI() {
    document.getElementById('showLoginBtn').style.display = 'block';
    document.getElementById('showRegisterBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'none';
}

// Load User Profile
async function loadUserProfile() {
    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';

    try {
        const data = await apiCall('/me/');
        
        profileContent.innerHTML = `
            <div class="profile-info">
                <div class="profile-item">
                    <strong>Name</strong>
                    ${data.first_name} ${data.last_name}
                </div>
                <div class="profile-item">
                    <strong>Username</strong>
                    ${data.username}
                </div>
                <div class="profile-item">
                    <strong>Email</strong>
                    ${data.email}
                </div>
                <div class="profile-item">
                    <strong>Phone</strong>
                    ${data.tel || 'N/A'}
                </div>
                <div class="profile-item">
                    <strong>Blood Group</strong>
                    ${data.groupe_sanguin || 'Not specified'}
                </div>
                <div class="profile-item">
                    <strong>Date of Birth</strong>
                    ${data.date_naissance || 'Not specified'}
                </div>
                <div class="profile-item">
                    <strong>Location</strong>
                    ${data.location || 'Not specified'}
                </div>
                <div class="profile-item">
                    <strong>Ready to Donate</strong>
                    ${data.pret_pour_don ? 'Yes' : 'No'}
                </div>
                <div class="profile-item">
                    <strong>Total Donations</strong>
                    ${data.donation_count || 0}
                </div>
                ${data.badge ? `<div class="profile-item"><strong>Badge</strong><span class="badge">${data.badge}</span></div>` : ''}
                ${data.bio ? `<div class="profile-item" style="grid-column: 1 / -1;"><strong>Bio</strong>${data.bio}</div>` : ''}
            </div>
        `;
    } catch (error) {
        profileContent.innerHTML = `<div class="error-message show">Error loading profile: ${error.message}</div>`;
    }
}

// Load Donation History
async function loadDonationHistory() {
    const donationList = document.getElementById('donationList');
    donationList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading donations...</div>';

    try {
        const data = await apiCall('/donations/');
        
        if (data.donation_history && data.donation_history.length > 0) {
            donationList.innerHTML = data.donation_history.map(donation => `
                <div class="donation-item">
                    <strong>Date:</strong> ${donation.date_don}<br>
                    <strong>Location:</strong> ${donation.lieu_don}<br>
                    <strong>Quantity:</strong> ${donation.quantite_donnee} ml
                </div>
            `).join('');
        } else {
            donationList.innerHTML = '<p>No donation history yet. Add your first donation!</p>';
        }
    } catch (error) {
        donationList.innerHTML = `<div class="error-message show">Error loading donations: ${error.message}</div>`;
    }
}

// Handle Donation Submission
async function handleDonationSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('donationError');

    const donationData = {
        date_don: document.getElementById('dateDon').value,
        lieu_don: document.getElementById('lieuDon').value,
        quantite_donnee: parseFloat(document.getElementById('quantiteDonnee').value),
    };

    try {
        const data = await apiCall('/donations/', {
            method: 'POST',
            body: donationData,
        });

        if (data.message) {
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
            document.getElementById('donationModal').style.display = 'none';
            document.getElementById('donationForm').reset();
            loadDonationHistory();
            loadUserProfile(); // Refresh profile to update donation count
            alert('Donation recorded successfully!');
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Failed to record donation. Please try again.';
        errorDiv.classList.add('show');
    }
}

// Load Leaderboard
async function loadLeaderboard() {
    const leaderboardContent = document.getElementById('leaderboardContent');
    leaderboardContent.innerHTML = '<div class="loading"><div class="spinner"></div>Loading leaderboard...</div>';

    try {
        const data = await apiCall('/leaderboard/monthly/');
        
        if (data.leaderboard && data.leaderboard.length > 0) {
            leaderboardContent.innerHTML = data.leaderboard.map((entry, index) => `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-username">${entry.username}</span>
                    <span class="leaderboard-count">${entry.donation_count} donations</span>
                </div>
            `).join('');
        } else {
            leaderboardContent.innerHTML = '<p>No donations this month yet. Be the first!</p>';
        }
    } catch (error) {
        leaderboardContent.innerHTML = `<div class="error-message show">Error loading leaderboard: ${error.message}</div>`;
    }
}

// Load Donation Centers
async function loadDonationCenters() {
    const centersContent = document.getElementById('centersContent');
    centersContent.innerHTML = '<div class="loading"><div class="spinner"></div>Loading centers...</div>';

    try {
        const data = await apiCall('/donation_centers/');
        
        if (data.donation_centers && data.donation_centers.length > 0) {
            centersContent.innerHTML = data.donation_centers.map(center => `
                <div class="center-item">
                    <h3>${center.nom}</h3>
                    <p><strong>Address:</strong> ${center.adresse}</p>
                    <p><strong>Phone:</strong> ${center.telephone}</p>
                    <p><strong>Email:</strong> <a href="mailto:${center.email}">${center.email}</a></p>
                </div>
            `).join('');
        } else {
            centersContent.innerHTML = '<p>No donation centers available.</p>';
        }
    } catch (error) {
        centersContent.innerHTML = `<div class="error-message show">Error loading centers: ${error.message}</div>`;
    }
}

