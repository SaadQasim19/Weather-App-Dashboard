//! document.addEventListener('DOMContentLoaded', function() {

//& DOM Elements
const elements = {
  locationInput: document.getElementById("location-input"),
  dateInput: document.getElementById("date-input"),
  searchBtn: document.getElementById("search-btn"),
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),
  currentTemp: document.getElementById("current-temp"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  windSpeed: document.getElementById("wind-speed"),
  pressure: document.getElementById("pressure"),
  locationName: document.getElementById("location-name"),
  currentDate: document.getElementById("current-date"),
  weatherDescription: document.getElementById("weather-description"),
  weatherIcon: document.getElementById("weather-icon"),
  hourlyContainer: document.querySelector(".hourly-scroll"),
  dailyContainer: document.querySelector(".daily-forecast-container"),
  tempChartCtx: document.getElementById("temperature-chart").getContext("2d"),
  precipChartCtx: document
    .getElementById("precipitation-chart")
    .getContext("2d"),
  windChartCtx: document.getElementById("wind-chart").getContext("2d"),
  body: document.body,
};

const state = {
  tempChart: null,
  precipChart: null,
  windChart: null,
  currentWeather: null,
  hourlyForecast: null,
  dailyForecast: null,
};

const weatherBackgrounds = {
  clear: [0, 1],
  cloudy: [2, 3],
  rainy: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snowy: [71, 73, 75, 77, 85, 86],
  stormy: [95, 96, 99],
};

const tempBackgrounds = {
  freezing: { maxTemp: 0, class: "body-freezing" }, // Below 0°C
  cold: { maxTemp: 10, class: "body-cold" }, // 0-10°C
  cool: { maxTemp: 20, class: "body-cool" }, // 10-20°C
  warm: { maxTemp: 30, class: "body-warm" }, // 20-30°C
  hot: { maxTemp: Infinity, class: "body-hot" }, // 30°C+
};

//& Initialize the App
function init() {
  elements.dateInput.valueAsDate = new Date();
  initParticles();
  setupEventListeners();
  elements.locationInput.value = "London"; // Default location
  fetchWeatherData();
}
//& Initialize the Floating Particles Animation
function initParticles() {
  const particles = document.querySelectorAll(".particle");
  particles.forEach((particle, index) => {
    gsap.to(particle, {
      y: -window.innerHeight - 100,
      rotation: 360,
      duration: 15 + Math.random() * 10,
      delay: index * 2,
      ease: "none",
      repeat: -1,
    });
  });
}
//& Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  elements.searchBtn.addEventListener("click", () => {
    animateButton(elements.searchBtn, fetchWeatherData);
  });

  elements.locationInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      animateButton(elements.searchBtn, fetchWeatherData);
    }
  });
}

//* Tab switching with animation

function switchTab() {
  const tabId = this.getAttribute("data-tab");

  gsap.to(elements.tabContents, {
    opacity: 0,
    y: 20,
    duration: 0.3,
    ease: "power2.out",
    onComplete: () => {
      elements.tabBtns.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      elements.tabContents.forEach((content) =>
        content.classList.remove("active")
      );
      const activeTab = document.getElementById(`${tabId}-tab`);
      activeTab.classList.add("active");

      gsap.fromTo(
        activeTab,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "back.out" }
      );

      if (tabId === "graphs" && state.hourlyForecast) {
        updateCharts();
      }
    },
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
    onComplete: callback,
  });
}

//* Main function to fetch weather data
async function fetchWeatherData() {
  const location = elements.locationInput.value.trim();
  const date = elements.dateInput.value;

  if (!location) {
    showError();
    return;
  }

  try {
    setLoadingState(true);

    //* Step 1: Geocoding - Get coordinates from location name

    const coords = await getCoordinates(location);
    if (!coords) throw new Error("Location not found");

    //* Step 2: Get weather data

    const weatherData = await getWeatherData(coords, date);

    //* Step 3: Process and display data

    processWeatherData(weatherData, new Date(date));
    updateUI();
  } catch (error) {
    console.error("Error:", error);
    showError();
  } finally {
    setLoadingState(false);
  }
}

//* ----------- Get coordinates from location name -----------------

  async function getCoordinates(location) {
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
    const response = await fetch(geocodingUrl);
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;
    
    const { latitude, longitude, name, admin1, country } = data.results[0];
    animateLocationChange(`${name}, ${admin1 || ''} ${country}`);
    
    return { latitude, longitude };
}

//* ----------- Get weather data from coordinates ------------------

   async function getWeatherData(coords, date) {
    const selectedDate = new Date(date);
    const startDate = formatDate(selectedDate);
    const endDate = formatDate(new Date(selectedDate.getTime() + 86400000)); // +1 day
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m,winddirection_10m,pressure_msl&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,winddirection_10m_dominant&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(weatherUrl);
    return await response.json();
}

//* ------------------------ Process raw weather data into app state ----------------------

    function processWeatherData(data, selectedDate) {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const currentHour = isToday ? now.getHours() : 12; // Default to noon if not today
      
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const startIndex = data.hourly.time.findIndex(time => time.startsWith(selectedDateStr));
      
//~ Process hourly forecast data

      state.hourlyForecast = {
          time: data.hourly.time.slice(startIndex, startIndex + 24),
          temperature: data.hourly.temperature_2m.slice(startIndex, startIndex + 24),
          apparentTemperature: data.hourly.apparent_temperature.slice(startIndex, startIndex + 24),
          humidity: data.hourly.relativehumidity_2m.slice(startIndex, startIndex + 24),
          precipitationProbability: data.hourly.precipitation_probability.slice(startIndex, startIndex + 24),
          weatherCode: data.hourly.weathercode.slice(startIndex, startIndex + 24),
          windSpeed: data.hourly.windspeed_10m.slice(startIndex, startIndex + 24),
          windDirection: data.hourly.winddirection_10m.slice(startIndex, startIndex + 24),
          pressure: data.hourly.pressure_msl.slice(startIndex, startIndex + 24)
      };
      
  //~ Process current weather data

      state.currentWeather = {
          temperature: data.hourly.temperature_2m[startIndex + currentHour],
          apparentTemperature: data.hourly.apparent_temperature[startIndex + currentHour],
          humidity: data.hourly.relativehumidity_2m[startIndex + currentHour],
          precipitationProbability: data.hourly.precipitation_probability[startIndex + currentHour],
          weatherCode: data.hourly.weathercode[startIndex + currentHour],
          windSpeed: data.hourly.windspeed_10m[startIndex + currentHour],
          windDirection: data.hourly.winddirection_10m[startIndex + currentHour],
          pressure: data.hourly.pressure_msl[startIndex + currentHour]
      };
      
//~ Process daily forecast data
//~ Process raw weather data into app state

    function processWeatherData(data, selectedDate) {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const currentHour = isToday ? now.getHours() : 12;                  //! Default to noon if not today
      
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      const startIndex = data.hourly.time.findIndex(time => time.startsWith(selectedDateStr));
      
//~ Process hourly forecast data
      state.hourlyForecast = {
          time: data.hourly.time.slice(startIndex, startIndex + 24),
          temperature: data.hourly.temperature_2m.slice(startIndex, startIndex + 24),
          apparentTemperature: data.hourly.apparent_temperature.slice(startIndex, startIndex + 24),
          humidity: data.hourly.relativehumidity_2m.slice(startIndex, startIndex + 24),
          precipitationProbability: data.hourly.precipitation_probability.slice(startIndex, startIndex + 24),
          weatherCode: data.hourly.weathercode.slice(startIndex, startIndex + 24),
          windSpeed: data.hourly.windspeed_10m.slice(startIndex, startIndex + 24),
          windDirection: data.hourly.winddirection_10m.slice(startIndex, startIndex + 24),
          pressure: data.hourly.pressure_msl.slice(startIndex, startIndex + 24)
      };
      
//~ Process current weather data
      state.currentWeather = {
          temperature: data.hourly.temperature_2m[startIndex + currentHour],
          apparentTemperature: data.hourly.apparent_temperature[startIndex + currentHour],
          humidity: data.hourly.relativehumidity_2m[startIndex + currentHour],
          precipitationProbability: data.hourly.precipitation_probability[startIndex + currentHour],
          weatherCode: data.hourly.weathercode[startIndex + currentHour],
          windSpeed: data.hourly.windspeed_10m[startIndex + currentHour],
          windDirection: data.hourly.winddirection_10m[startIndex + currentHour],
          pressure: data.hourly.pressure_msl[startIndex + currentHour]
      };
      
//~ Process daily forecast data
      state.dailyForecast = {
          time: data.daily.time,
          weatherCode: data.daily.weathercode,
          temperatureMax: data.daily.temperature_2m_max,
          temperatureMin: data.daily.temperature_2m_min,
          precipitationProbability: data.daily.precipitation_probability_max,
          windSpeed: data.daily.windspeed_10m_max,
          windDirection: data.daily.winddirection_10m_dominant
      };
  }


 //* ------------------------------- Update all UI elements --------------------------
 function updateUI() {
  updateBackground(state.currentWeather.weatherCode, state.currentWeather.temperature);

  updateCurrentWeather();
  updateHourlyForecast();
  updateDailyForecast();
  updateDateDisplay();
}

// Update background based on weather condition
function updateBackground(weatherCode, temperature) {
  // Remove all weather and temperature classes first
  const classesToRemove = [
      'body-clear', 'body-cloudy', 'body-rainy', 'body-snowy', 'body-stormy',
      'body-freezing', 'body-cold', 'body-cool', 'body-warm', 'body-hot'
  ];
  elements.body.classList.remove(...classesToRemove);
  
  // 1. Determine weather class based on weather code
  let weatherClass = 'body-cloudy'; // Default
  for (const [weatherType, codes] of Object.entries(weatherBackgrounds)) {
      if (codes.includes(weatherCode)) {
          weatherClass = `body-${weatherType}`;
          break;
      }
  }
  
  // 2. Determine temperature class
  let tempClass = 'body-cool'; // Default
  for (const [_, range] of Object.entries(tempBackgrounds)) {
      if (temperature <= range.maxTemp) {
          tempClass = range.class;
          break;
      }
  }
  
  // Combine both classes with animation
  gsap.to(elements.body, {
      duration: 1.5,
      onComplete: () => {
          elements.body.classList.add(weatherClass, tempClass);
      }
  });
}

 //* -------------------------- Update current weather display --------------------
 function updateCurrentWeather() {
  const weatherInfo = getWeatherInfo(state.currentWeather.weatherCode);
  
  // Animate temperature change
  animateValue(elements.currentTemp, Math.round(state.currentWeather.temperature));
  
  // Update other values with animation
  animateValue(elements.feelsLike, `${Math.round(state.currentWeather.apparentTemperature)}°C`);
  animateValue(elements.humidity, `${state.currentWeather.humidity}%`);
  animateValue(elements.windSpeed, `${state.currentWeather.windSpeed} km/h`);
  animateValue(elements.pressure, `${state.currentWeather.pressure} hPa`);
  
  // Update weather description and icon
  elements.weatherDescription.textContent = weatherInfo.description;
  
  // Animate weather icon change
  gsap.to(elements.weatherIcon, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
          elements.weatherIcon.style.backgroundImage = `url('${weatherInfo.icon}')`;
          gsap.to(elements.weatherIcon, {
              opacity: 1,
              duration: 0.5
          });
      }
  });
  
  // Animate detail items
  gsap.to(".detail-item", {
      y: -10,
      opacity: 1,
      stagger: 0.1,
      duration: 0.5,
      ease: "back.out"
  });
}

 //* ---------------------- Update hourly forecast display -------------------------
    function updateHourlyForecast() {
        elements.hourlyContainer.innerHTML = '';
        
        state.hourlyForecast.time.forEach((time, index) => {
            const date = new Date(time);
            const hour = date.getHours();
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            const weatherInfo = getWeatherInfo(state.hourlyForecast.weatherCode[index]);
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <div class="hourly-time">${displayHour} ${ampm}</div>
                <div class="hourly-icon" style="background-image: url('${weatherInfo.icon}')"></div>
                <div class="hourly-temp">${Math.round(state.hourlyForecast.temperature[index])}°</div>
                <div class="hourly-precip">${state.hourlyForecast.precipitationProbability[index]}%</div>
            `;
            
            // Add animation to each hourly item
            gsap.from(hourlyItem, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                delay: index * 0.05,
                ease: "back.out"
            });
            
            elements.hourlyContainer.appendChild(hourlyItem);
        });
    }

    //* ------------------- Update daily forecast display ------------------
    function updateDailyForecast() {
        elements.dailyContainer.innerHTML = '';
        
        state.dailyForecast.time.forEach((time, index) => {
            const date = new Date(time);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const weatherInfo = getWeatherInfo(state.dailyForecast.weatherCode[index]);
            
            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';
            dailyItem.innerHTML = `
                <div class="daily-day">${day}</div>
                <div class="daily-icon" style="background-image: url('${weatherInfo.icon}')"></div>
                <div class="daily-temp">
                    <span class="daily-high">${Math.round(state.dailyForecast.temperatureMax[index])}°</span>
                    <span class="daily-low">${Math.round(state.dailyForecast.temperatureMin[index])}°</span>
                </div>
                <div class="daily-precip">${state.dailyForecast.precipitationProbability[index]}%</div>
            `;
            
            // Add animation to each daily item
            gsap.from(dailyItem, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                delay: index * 0.1,
                ease: "back.out"
            });
            
            elements.dailyContainer.appendChild(dailyItem);
        });
    }
//* ---------------------------- Update date display -------------------
       function updateDateDisplay() {
        const selectedDate = new Date(elements.dateInput.value);
        const formattedDate = selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        gsap.to(elements.currentDate, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                elements.currentDate.textContent = formattedDate;
                gsap.to(elements.currentDate, { opacity: 1, duration: 0.5 });
            }
        });
    }
    
//* ----------------------------- Update weather charts -------------------
    function updateCharts() {
        // Destroy existing charts if they exist
        if (state.tempChart) state.tempChart.destroy();
        if (state.precipChart) state.precipChart.destroy();
        if (state.windChart) state.windChart.destroy();
        
        // Prepare labels (hours)
        const labels = state.hourlyForecast.time.map(time => {
            return new Date(time).getHours() + ':00';
        });
        
        // Create new charts
        state.tempChart = createTemperatureChart(labels);
        state.precipChart = createPrecipitationChart(labels);
        state.windChart = createWindChart(labels);
    }

    // Helper Functions
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function setLoadingState(isLoading) {
        elements.searchBtn.disabled = isLoading;
        gsap.to(elements.searchBtn, {
            backgroundColor: isLoading ? "#3a0ca3" : "#4361ee",
            duration: 0.3
        });
        elements.searchBtn.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> Loading...' 
            : '<i class="fas fa-cloud-sun-rain"></i> Get Forecast';
    }
    function showError() {
      gsap.to(elements.searchBtn, {
          backgroundColor: "#ef233c",
          duration: 0.3
      });
      
      gsap.to(elements.locationInput, {
          x: [-5, 5, -5, 5, 0],
          duration: 0.5,
          ease: "power1.inOut"
      });
      
      alert('Failed to fetch weather data. Please try again.');
  }
  function animateLocationChange(newLocation) {
    gsap.to(elements.locationName, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        onComplete: () => {
            elements.locationName.textContent = newLocation;
            gsap.to(elements.locationName, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out"
            });
        }
    });
}

function animateValue(element, newValue) {
    gsap.to(element, {
        textContent: newValue,
        duration: 0.8,
        snap: { textContent: 1 },
        ease: "power2.out"
    });
}
//* --------------------- Chart Creation Functions --------------------
    function createTemperatureChart(labels) {
      return new Chart(elements.tempChartCtx, {
          type: 'line',
          data: {
              labels: labels,
              datasets: [
                  {
                      label: 'Temperature (°C)',
                      data: state.hourlyForecast.temperature,
                      borderColor: 'rgba(255, 99, 132, 1)',
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: 'white',
                      pointBorderColor: 'rgba(255, 99, 132, 1)',
                      pointRadius: 4,
                      pointHoverRadius: 6
                  },
                  {
                      label: 'Feels Like (°C)',
                      data: state.hourlyForecast.apparentTemperature,
                      borderColor: 'rgba(54, 162, 235, 1)',
                      backgroundColor: 'rgba(54, 162, 235, 0.2)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: 'white',
                      pointBorderColor: 'rgba(54, 162, 235, 1)',
                      pointRadius: 4,
                      pointHoverRadius: 6
                  }
              ]
          },
          options: getChartOptions('Temperature Forecast', '°C')
      });
  }

  function createPrecipitationChart(labels) {
      return new Chart(elements.precipChartCtx, {
          type: 'bar',
          data: {
              labels: labels,
              datasets: [
                  {
                      label: 'Precipitation Probability (%)',
                      data: state.hourlyForecast.precipitationProbability,
                      backgroundColor: 'rgba(75, 192, 192, 0.6)',
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1
                  },
                  {
                      label: 'Humidity (%)',
                      data: state.hourlyForecast.humidity,
                      backgroundColor: 'rgba(153, 102, 255, 0.6)',
                      borderColor: 'rgba(153, 102, 255, 1)',
                      borderWidth: 2,
                      type: 'line',
                      tension: 0.4,
                      fill: false
                  }
              ]
          },
          options: getChartOptions('Precipitation & Humidity', '%', true)
      });
  }

  }
