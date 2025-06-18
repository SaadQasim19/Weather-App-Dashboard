// document.addEventListener('DOMContentLoaded', function() {

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

//& Initialize the App
function init() {
    elements.dateInput.valueAsDate = new Date();
    initParticles();
    setupEventListeners();
    elements.locationInput.value = 'London'; // Default location
    fetchWeatherData();
}
//& Initialize the Floating Particles Animation
function initParticles() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        gsap.to(particle, {
            y: -window.innerHeight - 100,
            rotation: 360,
            duration: 15 + Math.random() * 10,
            delay: index * 2,
            ease: "none",
            repeat: -1
        });
    });


}
//& Setup Event Listeners
function setupEventListeners() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    elements.searchBtn.addEventListener('click', () => {
        animateButton(elements.searchBtn, fetchWeatherData);
    });

    elements.locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            animateButton(elements.searchBtn, fetchWeatherData);
        }
    });
}

//* Tab switching with animation

function switchTab() {
    const tabId = this.getAttribute('data-tab');
    
    gsap.to(elements.tabContents, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
            elements.tabBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            elements.tabContents.forEach(content => content.classList.remove('active'));
            const activeTab = document.getElementById(`${tabId}-tab`);
            activeTab.classList.add('active');
            
            gsap.fromTo(activeTab, 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "back.out" }
            );
            
            if (tabId === 'graphs' && state.hourlyForecast) {
                updateCharts();
            }
        }
    });
}

//* Button animation
    function animateButton(button, callback) {
        gsap.to(button, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
            onComplete: callback
        });
    }