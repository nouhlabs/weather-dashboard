// API Configuration
const API_KEY = 'f9a8750529ba7a57478af9ef922a4913';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherData = document.getElementById('weatherData');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        showError('Please enter a city name');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }
});

locationBtn.addEventListener('click', getCurrentLocation);

// Get weather by city name
async function getWeatherByCity(city) {
    try {
        showLoading();
        hideError();
        
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayWeather(currentData, forecastData);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('City not found. Please check the spelling and try again.');
        hideWeather();
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        showLoading();
        hideError();
        
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayWeather(currentData, forecastData);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Unable to get weather data. Please try again.');
        hideWeather();
    }
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            () => {
                hideLoading();
                showError('Unable to get your location. Please search for a city instead.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Display weather data
function displayWeather(current, forecast) {
    document.getElementById('cityName').textContent = `${current.name}, ${current.sys.country}`;
    document.getElementById('currentDate').textContent = formatDate(new Date());
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
    document.getElementById('temperature').textContent = `${Math.round(current.main.temp)}°C`;
    document.getElementById('description').textContent = current.weather[0].description;
    document.getElementById('feelsLike').textContent = `${Math.round(current.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${current.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;
    
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    
    // Get one forecast per day (noon or closest available time)
const dailyForecasts = [];
const processedDays = new Set();

forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    // Get one forecast per day (preferably around noon)
    if (!processedDays.has(dayKey) && dailyForecasts.length < 5) {
        const hour = date.getHours();
        // Prefer forecasts between 9am-3pm
        if (hour >= 9 && hour <= 15) {
            dailyForecasts.push(item);
            processedDays.add(dayKey);
        }
    }
});

// If we don't have 5 days, fill with any remaining forecasts
if (dailyForecasts.length < 5) {
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!processedDays.has(dayKey) && dailyForecasts.length < 5) {
            dailyForecasts.push(item);
            processedDays.add(dayKey);
        }
    });
}    
    dailyForecasts.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="date">${formatForecastDate(new Date(day.dt * 1000))}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
            <div class="temp">${Math.round(day.main.temp)}°C</div>
            <div class="desc">${day.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
    
    weatherData.classList.remove('hidden');
}

// Utility functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatForecastDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showLoading() {
    loading.classList.remove('hidden');
    searchBtn.disabled = true;
    locationBtn.disabled = true;
}

function hideLoading() {
    loading.classList.add('hidden');
    searchBtn.disabled = false;
    locationBtn.disabled = false;
}

function hideWeather() {
    weatherData.classList.add('hidden');
}

// Load default city on page load
window.addEventListener('load', () => {
    getWeatherByCity('London');
});
