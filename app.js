const iconElement = document.querySelector(".weather-icon");
const locationIcon = document.querySelector(".location-icon");
const tempElement = document.querySelector(".temperature-value p");
const descElement = document.querySelector(".temperature-description p");
const locationElement = document.querySelector(".location p");
const notificationElement = document.querySelector(".notification");

var input = document.getElementById("search");
let city = "";
let latitude = 0.0;
let longitude = 0.0;

input.addEventListener("keyup", function (event) {
  if (event.key === "Enter") { // Use event.key instead of event.keyCode
    event.preventDefault();
    city = input.value;
    getSearchWeather(city);
    console.log(city);
  }
});

const weather = {};

weather.temperature = {
  unit: "celsius",
};

const KELVIN = 273;

const key = "4374c0761c84b7297b31052a548e9c87"; // Replace with your OpenWeatherMap API key

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(setPosition, showError);
} else {
  notificationElement.style.display = "block";
  notificationElement.innerHTML =
    '<p> Browser doesn\'t support geolocation </p>';
}

function setPosition(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  getWeather(latitude, longitude);
}

locationIcon.addEventListener("click", function (event) {
  console.log("hey");
  getWeather(latitude, longitude);
});

function showError(error) {
  notificationElement.style.display = "block";
  notificationElement.innerHTML = `<p> ${error.message} </p>`;
}

async function getSearchWeather(city) {
  const apiBase = "https://api.openweathermap.org/data/2.5/weather";
  let api = `${apiBase}?q=${city}&appid=${key}`;

  try {
    const response = await fetch(api);
    const data = await response.json();
    weather.temperature.value = Math.floor(data.main.temp - KELVIN);
    weather.description = data.weather[0].description;
    weather.iconId = data.weather[0].icon;
    weather.city = data.name;
    weather.country = data.sys.country;
    displayWeather();
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

async function getWeather(latitude, longitude) {
  const apiBase = "https://api.openweathermap.org/data/2.5/weather";
  let api = `${apiBase}?lat=${latitude}&lon=${longitude}&appid=${key}`;

  try {
    const response = await fetch(api);
    const data = await response.json();
    weather.temperature.value = Math.floor(data.main.temp - KELVIN);
    weather.description = data.weather[0].description;
    weather.iconId = data.weather[0].icon;
    weather.city = data.name;
    weather.country = data.sys.country;
    displayWeather();
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

function backgroundChange(weatherCondition) {
  const bgvideo = document.getElementById("bgvideo");
  if (!bgvideo) {
    console.error("Background video element not found!");
    return;
  }

  function backgroundChange(weatherCondition) {
    const backgroundImg = document.getElementById("backgroundImg");
    if (weatherCondition === "Rain") {
      backgroundImg.src = "https://studioghiblimovies.com/wp-content/uploads/2018/01/216.jpg"; // Replace with the direct URL of the rain image.
    } else if (weatherCondition === "Clouds") {
      backgroundImg.src = "https://example.com/cloudy-background.jpg"; // Replace with the direct URL of the clouds image.
    } else if (weatherCondition === "Clear") {
      backgroundImg.src = "https://example.com/clear-background.jpg"; // Replace with the direct URL of the clear image.
    } else if (weatherCondition === "Haze") {
      backgroundImg.src = "https://example.com/haze-background.jpg"; // Replace with the direct URL of the haze image.
    } else {
      backgroundImg.src = "https://example.com/default-background.jpg"; // Replace with the direct URL of the default image.
    }
  }
}



function displayWeather() {
  iconElement.innerHTML = `<img src="https://openweathermap.org/img/w/${weather.iconId}.png" style="width: 100px; height: 100px;"/>`;
  tempElement.innerHTML = `${weather.temperature.value}<span>&#8451;</span>`;
  descElement.innerHTML = weather.description;
  locationElement.innerHTML = `${weather.city}, ${weather.country}`;

  backgroundChange(weather.description);
}
