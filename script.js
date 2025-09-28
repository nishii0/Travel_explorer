// API Configuration
// IMPORTANT: Replace these with your own API keys
const API_CONFIG = {
    UNSPLASH_ACCESS_KEY: '6FnJWyacsKr6q6F6HVo8oLz305vD1mYKXT83UkRIgH4',
    OPENWEATHER_API_KEY: '95b3ad67f5aa0654a63ed68e97ac55ef'
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    weatherCard: document.getElementById('weatherCard'),
    photoGallery: document.getElementById('photoGallery'),
    photoGrid: document.getElementById('photoGrid'),
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    loadMoreBtn: document.getElementById('loadMore'),
    modal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    modalCaption: document.getElementById('modalCaption'),
    photographerName: document.getElementById('photographerName'),
    photographerLink: document.getElementById('photographerLink'),
    quickTags: document.querySelectorAll('.tag')
};

// State Management
let currentCity = ''; 
let currentPage = 1;
let totalPages = 1;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkAPIKeys();
});

// Check if API keys are configured
function checkAPIKeys() {
    if (API_CONFIG.UNSPLASH_ACCESS_KEY === '6FnJWyacsKr6q6F6HVo8oLz305vD1mYKXT83UkRIgH4' || 
        API_CONFIG.OPENWEATHER_API_KEY === '590db70b20d11dc7b1996fe4ae398efe') {
        showError('Please configure your API keys in the JavaScript file. You need to sign up for free API keys from Unsplash and OpenWeather.');
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Search functionality
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Quick destination tags
    elements.quickTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const city = tag.dataset.city;
            elements.searchInput.value = city;
            handleSearch();
        });
    });

    // Load more photos
    elements.loadMoreBtn.addEventListener('click', loadMorePhotos);

    // Modal functionality
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Handle Search
async function handleSearch() {
    const city = elements.searchInput.value.trim();
    
    if (!city) {
        showError('Please enter a destination to search');
        return;
    }

    currentCity = city;
    currentPage = 1;
    
    // Clear previous results
    hideAllSections();
    showLoader();
    
    try {
        // Fetch both weather and photos in parallel
        const [weatherData, photosData] = await Promise.all([
            fetchWeatherData(city),
            fetchPhotos(city, 1)
        ]);
        
        // Display results
        hideLoader();
        displayWeather(weatherData);
        displayPhotos(photosData);
        
        // Scroll to results
        document.getElementById('destinations').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        hideLoader();
        showError(error.message);
    }
}

// Fetch Weather Data
async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_CONFIG.OPENWEATHER_API_KEY}&units=metric`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            }
            throw new Error('Failed to fetch weather data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Weather API Error:', error);
        throw error;
    }
}

// Fetch Photos from Unsplash
async function fetchPhotos(query, page = 1) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=9&client_id=${API_CONFIG.UNSPLASH_ACCESS_KEY}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch photos');
        }
        
        const data = await response.json();
        totalPages = data.total_pages;
        return data;
    } catch (error) {
        console.error('Unsplash API Error:', error);
        throw error;
    }
}

// Display Weather Information
function displayWeather(data) {
    // Update weather card elements
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('countryName').textContent = data.sys.country;
    document.getElementById('temp').textContent = Math.round(data.main.temp);
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById('description').textContent = data.weather[0].description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Set weather icon
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weatherIcon').alt = data.weather[0].description;
    
    // Show weather card
    elements.weatherCard.classList.remove('hidden');
}

// Display Photos
function displayPhotos(data, append = false) {
    if (!append) {
        elements.photoGrid.innerHTML = '';
    }
    
    // Update gallery title
    document.getElementById('galleryCity').textContent = currentCity;
    
    // Create photo items
    data.results.forEach(photo => {
        const photoItem = createPhotoElement(photo);
        elements.photoGrid.appendChild(photoItem);
    });
    
    // Show gallery
    elements.photoGallery.classList.remove('hidden');
    
    // Show/hide load more button
    if (currentPage < totalPages && totalPages > 1) {
        elements.loadMoreBtn.classList.remove('hidden');
    } else {
        elements.loadMoreBtn.classList.add('hidden');
    }
}

// Create Photo Element
function createPhotoElement(photo) {
    const div = document.createElement('div');
    div.className = 'photo-item';
    
    const img = document.createElement('img');
    img.src = photo.urls.regular;
    img.alt = photo.alt_description || `Photo of ${currentCity}`;
    img.loading = 'lazy';
    
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    overlay.innerHTML = `
        <p class="photographer">📷 ${photo.user.name}</p>
    `;
    
    div.appendChild(img);
    div.appendChild(overlay);
    
    // Add click event to open modal
    div.addEventListener('click', () => openModal(photo));
    
    return div;
}

// Load More Photos
async function loadMorePhotos() {
    currentPage++;
    elements.loadMoreBtn.disabled = true;
    elements.loadMoreBtn.textContent = 'Loading...';
    
    try {
        const photosData = await fetchPhotos(currentCity, currentPage);
        displayPhotos(photosData, true);
    } catch (error) {
        showError('Failed to load more photos');
    } finally {
        elements.loadMoreBtn.disabled = false;
        elements.loadMoreBtn.textContent = 'Load More Photos';
    }
}

// Open Modal
function openModal(photo) {
    elements.modalImage.src = photo.urls.full;
    elements.modalImage.alt = photo.alt_description || `Photo of ${currentCity}`;
    elements.modalCaption.textContent = photo.description || photo.alt_description || '';
    elements.photographerName.textContent = photo.user.name;
    elements.photographerLink.href = photo.user.links.html;
    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal() {
    elements.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Show Loader
function showLoader() {
    elements.loader.classList.remove('hidden');
}

// Hide Loader
function hideLoader() {
    elements.loader.classList.add('hidden');
}

// Show Error Message
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

// Hide All Sections
function hideAllSections() {
    elements.weatherCard.classList.add('hidden');
    elements.photoGallery.classList.add('hidden');
    elements.errorMessage.classList.add('hidden');
}

// Format Date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

// Check Internet Connection
window.addEventListener('online', () => {
    console.log('Back online');
});

window.addEventListener('offline', () => {
    showError('No internet connection. Please check your connection and try again.');
});

// Handle API Rate Limiting
function handleRateLimit(retryAfter = 60) {
    showError(`API rate limit reached. Please try again in ${retryAfter} seconds.`);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add live search with debouncing (optional enhancement)
const debouncedSearch = debounce(() => {
    if (elements.searchInput.value.trim().length > 2) {
        handleSearch();
    }
}, 1000);

// Optional: Add this for live search as user types
// elements.searchInput.addEventListener('input', debouncedSearch);

// Service Worker Registration (for PWA support - optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed'));
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchWeatherData,
        fetchPhotos,
        formatDate
    };
}