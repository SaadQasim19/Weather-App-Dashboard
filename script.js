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

const state = {
    tempChart: null,
    precipChart: null,
    windChart: null,
    currentWeather: null,
    hourlyForecast: null,
    dailyForecast: null
};

const weatherBackgrounds = {
    clear: [0, 1],
    cloudy: [2, 3],
    rainy: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
    snowy: [71, 73, 75, 77, 85, 86],
    stormy: [95, 96, 99]
};

const tempBackgrounds = {
    freezing: { maxTemp: 0, class: 'body-freezing' },       // Below 0°C
    cold: { maxTemp: 10, class: 'body-cold' },             // 0-10°C
    cool: { maxTemp: 20, class: 'body-cool' },             // 10-20°C
    warm: { maxTemp: 30, class: 'body-warm' },             // 20-30°C
    hot: { maxTemp: Infinity, class: 'body-hot' }          // 30°C+
};