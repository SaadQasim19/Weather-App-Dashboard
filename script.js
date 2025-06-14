//& DOM Elements
const elements = {
    locationInput: document.getElementById('location-input'),
    dateInput: document.getElementById('date-input'),
    searchBtn: document.getElementById('search-btn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    currentTemp: document.getElementById('current-temp'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    pressure: document.getElementById('pressure'),
    locationName: document.getElementById('location-name'),
    currentDate: document.getElementById('current-date'),
    weatherDescription: document.getElementById('weather-description'),
    weatherIcon: document.getElementById('weather-icon'),
    hourlyContainer: document.querySelector('.hourly-scroll'),
    dailyContainer: document.querySelector('.daily-forecast-container'),
    tempChartCtx: document.getElementById('temperature-chart').getContext('2d'),
    precipChartCtx: document.getElementById('precipitation-chart').getContext('2d'),
    windChartCtx: document.getElementById('wind-chart').getContext('2d'),
    body: document.body
};