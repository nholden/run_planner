/* Creates page elements. */
var containerDiv = document.createElement("div");
containerDiv.id = "container";
document.body.appendChild(containerDiv);

var locationDiv = document.createElement("div");
locationDiv.id = "location";
locationDiv.textContent = "Running in ";
containerDiv.appendChild(locationDiv);

var cityLink = document.createElement("a");
cityLink.href = "";
locationDiv.appendChild(cityLink);

var zipCodeInput = document.createElement("input");
zipCodeInput.type = "text";
zipCodeInput.id = "zipCode";
zipCodeInput.placeholder = "Zip code";
containerDiv.appendChild(zipCodeInput);

var setLocationButton = document.createElement("button");
setLocationButton.textContent = "Set location";
setLocationButton.id = "setLocation";
containerDiv.appendChild(setLocationButton);

var timeSelect = document.createElement("select");
timeSelect.id = "time";
containerDiv.appendChild(timeSelect);

var nowOption = document.createElement("option");
nowOption.textContent = "Now";
nowOption.value = "now";
timeSelect.appendChild(nowOption);

/* Adds next 24 hours to time menu. */
next24Hours(new Date).forEach(function(hour) {
  var hourOption = document.createElement("option");
  hourOption.value = hour.getTime();
  hourOption.textContent = hour12Format(hour);
  timeSelect.appendChild(hourOption);
});

/* Creates more page elements. */
var errorDiv = document.createElement("div");
container.appendChild(errorDiv);

var weatherDiv = document.createElement("div");
container.appendChild(weatherDiv);

var clothesDiv = document.createElement("div");
container.appendChild(clothesDiv);

/**
 * Checks local storage for a saved zip code. If found and
 * successfully able to update the page, shows the planner.
 * Otherwise, defaults to prompting the user for a zip code.
 */
var weatherInZip, savedZip = localStorage.getItem("zipCode");
if (savedZip) {
  weatherInZip = getWeatherInZip(savedZip);
  if (update()) {
    showPlanner();
  }
}

/**
 * When the user clicks the set location button, saves 
 * zip code to local storage and shows the planner. 
 */
setLocationButton.addEventListener("click", function(event) {
  event.preventDefault();
  if (update()) {
    localStorage.setItem("zipCode", zipCodeInput.value)
    showPlanner();
  }
});

/* When user chooses a different time, updates the page. */
timeSelect.addEventListener("change", function() {
  update();
});

/**
 * When the user clicks name of city, removes zip code
 * from local storage and prompts the user for a zip code.
 */
cityLink.addEventListener("click", function(event) {
  event.preventDefault();
  localStorage.removeItem("zipCode");
  showZipCodeEntry();
});

/**
 * Updates the location, weather, and clothing recommendation
 * elements on the page based on the user's inputs.
 */
function update() {
  try {
    if (!weatherInZip) {
      weatherInZip = getWeatherInZip(zipCodeInput.value);
    }
    var weather = getWeatherAtTime(weatherInZip, timeSelect.value);
    cityLink.textContent = weather.city;
    weatherDiv.innerHTML = weather.time +
                           "<br>Temperature: " + weather.temp + "&deg;F" +
                           "<br>Conditions: " + weather.cond +
                           "<br>Wind speed: " + weather.wind + " mph";
    var clothes = recommendClothes(weather);
    var clothesHTML = "";
    for (var bodyPart in clothes) {
      clothesHTML += "<br>Wear " + clothes[bodyPart] + " on your " 
                     + bodyPart + ".";
    }
    clothesDiv.innerHTML = "Clothing recommendations" + clothesHTML;
    errorDiv.style.display = "none";
    return true;
  } catch(err) {
    errorDiv.textContent = err;
    errorDiv.style.display = "block";
    return false;
  }
}

/* Shows page elements associated with zip code entry. */
function showZipCodeEntry() {
  locationDiv.style.display = "none";
  zipCodeInput.style.display = "inline";
  setLocationButton.style.display = "inline";
  timeSelect.style.display = "none";
  weatherDiv.textContent = null;
  clothesDiv.textContent = null;
}

/* Shows page elements associated with run planning. */
function showPlanner() {
  locationDiv.style.display = "block";
  zipCodeInput.style.display = "none";
  setLocationButton.style.display = "none";
  timeSelect.style.display = "block";
} 

/** 
 * Given a date object, rounds down to the nearest hour and
 * returns an array of date objects for the next 24 hours.
 */
function next24Hours(date) {
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  var next24Hours = [];
  for (var i = 1; i < 25; i++) {
    next24Hours.push(new Date(date.getTime() + (3600000 * i)));
  }

  return next24Hours;
}

/** 
 * Given a date object, returns a string
 * with the hour in 12-hour format.
 */
function hour12Format(date) {
  var now = new Date();
  var hour12Format = "";
  if (date.getHours() == 0) {
    hour12Format += "Midnight";
  } else if (date.getHours() < 12) {
    hour12Format += date.getHours() + " A.M.";
  } else if (date.getHours() == 12) {
    hour12Format += "Noon";
  } else {
    hour12Format += date.getHours() - 12 + " P.M.";
  }

  if (date.getDay() == now.getDay()) {
    hour12Format += " today";
  } else if (date.getDay() == now.getDay() + 1 || 
             date.getDay() < now.getDay()) {
    hour12Format += " tomorrow";
  }

  return hour12Format;
} 

/**
 * Given a US zip code, queries the weather API for current
 * conditions and hourly forecasts, parses that data and 
 * returns an object with that data.
 */
function getWeatherInZip(zipCode) {
  var weatherApiRootUrl = "http://api.wunderground.com/api/585c642644dd880e/";
  var req = new XMLHttpRequest();
  req.open("GET", weatherApiRootUrl + "conditions/hourly/q/"
           + zipCode + "/q.json", false);
  req.send(null);
  if (req.status != 200) {
    throw req.statusText;
  } else {
    var data = JSON.parse(req.responseText);
    if (!data.current_observation || !data.hourly_forecast) {
      throw data.response.error.description;
    } else {
      return data;
    }
  }
}

/**
 * Given an object with weather data from the weather API
 * and a unix time (UTC), returns an object with city, time 
 * and forecasted temp, cond, and wind properties. If time
 * given is "now", returns the current conditions.
 */
function getWeatherAtTime(data, time) {
  var weather;
  if (time == "now") {
    weather = {
      city: data.current_observation.display_location.city,
      time: data.current_observation.observation_time,
      temp: data.current_observation.temp_f,
      cond: data.current_observation.weather,
      wind: data.current_observation.wind_mph
    };
  } else {
    time = time/1000;
    var forecast;
    data.hourly_forecast.forEach(function(hourlyForecast) {
      if (hourlyForecast.FCTTIME.epoch == time) {
        forecast = hourlyForecast;
      } 
    });
    weather = {
      city: data.current_observation.display_location.city,
      time: forecast.FCTTIME.pretty,
      temp: forecast.temp.english,
      cond: forecast.condition,
      wind: forecast.wspd.english
    };
  }
  return weather;
}

/**
 * Given a weather object, returns an object with
 * body parts as keys and clothing as values.
 */
function recommendClothes(weather) {
  var clothes = {};
  if (weather.temp <= 15) {
    clothes.torso = "heavy jacket";
    clothes.legs = "tights";
    clothes.hands = "gloves";
    clothes.head = "hat";
  } else if (weather.temp <= 25) {
    clothes.torso = "light jacket";
    clothes.legs = "tights";
    clothes:hands = "gloves";
    clothes.head = "hat";
  } else if (weather.temp <= 35) {
    clothes.torso = "light jacket";
    clothes.legs = "tights";
    clothes.hands = "gloves";
  } else if (weather.temp <= 45) {
    clothes.torso = "long-sleeve shirt";
    clothes.legs = "shorts"
  } else {
    clothes.torso = "short-sleeve shirt";
    clothes.legs = "shorts";
  }
  return clothes;
}
