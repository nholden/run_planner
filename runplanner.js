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

var errorDiv = document.createElement("div");
errorDiv.id = "error";
containerDiv.appendChild(errorDiv);

var weatherDiv = document.createElement("div");
weatherDiv.id = "weather";
containerDiv.appendChild(weatherDiv);

var clothesDiv = document.createElement("div");
clothesDiv.id = "clothes";
containerDiv.appendChild(clothesDiv);

var rulesLink = document.createElement("a");
rulesLink.href = "";
rulesLink.textContent = "Change rules";
containerDiv.appendChild(rulesLink);

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
    localStorage.setItem("zipCode", zipCodeInput.value);
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
  weatherInZip = null;
  showZipCodeEntry();
});

/**
 * Updates the location, weather, and clothing recommendation
 * elements on the page based on the user's inputs.
 */
function update() {
  try {
    if (!weatherInZip) {
      if (zipCodeInput.value.match(/^\d{5}$/)) {
        weatherInZip = getWeatherInZip(zipCodeInput.value);
      } else {
        throw "Zip code must be five digits.";
      }
    }
    var weather = getWeatherAtTime(weatherInZip, timeSelect.value);
    cityLink.textContent = weather.city;
    weatherDiv.innerHTML = "<div id='cond'><i class='wi wi-wu-" + weather.icon + "'></i></div>" +
                           "<div id='temp'>" + weather.temp + "&deg;F</div>" +
                           "<div id='wind'>" + weather.wind + " mph</div>" +
                           "<div id='timeOutput'>" + weather.time + "</div>";
    clothesDiv.innerHTML = "You should wear:";
    var clothesList = document.createElement("ul");
    clothesDiv.appendChild(clothesList);
    var clothes = recommendClothes(weather);
    clothes.forEach(function(clothesItem) {
      var listItem = document.createElement("li"); 
      listItem.textContent = clothesItem;
      clothesList.appendChild(listItem);
    });
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
  resetTimeOptions();
  locationDiv.style.display = "none";
  zipCodeInput.style.display = "inline";
  setLocationButton.style.display = "inline";
  timeSelect.style.display = "none";
  weatherDiv.style.display = "none";
  weatherDiv.textContent = null;
  clothesDiv.style.display = "none";
  clothesDiv.textContent = null;
  rulesLink.style.display = "none";
}

/** 
 * Generate time options based on time zone in zip code 
 * and shows page elements associated with run planning. 
 */
function showPlanner() {
  resetTimeOptions();

  next24Hours(new Date()).forEach(function(hour) {
    var hourOption = document.createElement("option");
    hourOption.value = hour.getTime();
    hourOption.textContent = hour12Format(hour);
    timeSelect.appendChild(hourOption);
  });

  locationDiv.style.display = "block";
  zipCodeInput.style.display = "none";
  setLocationButton.style.display = "none";
  timeSelect.style.display = "block";
  weatherDiv.style.display = "block";
  clothesDiv.style.display = "block";
  rulesLink.style.display = "block";
} 

/* Removes all options from time select and rebuilds now option */
function resetTimeOptions() {
  while (timeSelect.firstChild) {
    timeSelect.removeChild(timeSelect.firstChild);
  }

  var nowOption = document.createElement("option");
  nowOption.textContent = "Now";
  nowOption.value = "now";
  timeSelect.appendChild(nowOption);
}

/** 
 * Given a date object, rounds down to the nearest hour and
 * returns an array of date objects for the next 24 hours.
 */
function next24Hours(date) {
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  var hours = [];
  for (var i = 1; i < 25; i++) {
    hours.push(new Date(date.getTime() + (3600000 * i)));
  }

  return hours;
}

/** 
 * Given a date object, returns a string with
 * the hour and timezone in 12-hour format.
 */
function hour12Format(date) {
  var formatted = "", now = new Date();

  var timezoneOffset = parseInt(now.getTimezoneOffset() / 60 + 
                                weatherInZip.current_observation.local_tz_offset / 100);
  date.setHours(date.getHours() + timezoneOffset);

  if (date.getHours() === 0) {
    formatted += "Midnight ";
  } else if (date.getHours() < 12) {
    formatted += date.getHours() + " A.M. ";
  } else if (date.getHours() == 12) {
    formatted += "Noon ";
  } else {
    formatted += date.getHours() - 12 + " P.M. ";
  }
  
  formatted += weatherInZip.current_observation.local_tz_short;

  if (date.getDay() == now.getDay()) {
    formatted += " today";
  } else if (date.getDay() == now.getDay() + 1 || 
             date.getDay() < now.getDay()) {
    formatted += " tomorrow";
  }

  return formatted;
} 

/**
 * Given a US zip code, queries the weather API for current
 * conditions and hourly forecasts, parses that data and 
 * returns an object with that data.
 */
function getWeatherInZip(zipCode) {
  var weatherApiRootUrl = "http://api.wunderground.com/api/585c642644dd880e/";
  var req = new XMLHttpRequest();
  req.open("GET", weatherApiRootUrl + "conditions/hourly/astronomy/q/" +
           zipCode + "/q.json", false);
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
 * and forecasted temp, icon, wind, and isDay properties.
 * If time given is "now", returns the current conditions.
 */
function getWeatherAtTime(data, time) {
  var weather;
  
  var isDay;
  var forecastTime = new Date();
  var timezoneOffset = parseInt(forecastTime.getTimezoneOffset() / 60 + 
                                data.current_observation.local_tz_offset /100);
  if (time != "now") forecastTime.setTime(time);
  var sunrise = new Date();
  sunrise.setTime(forecastTime);
  sunrise.setHours(parseInt(data.sun_phase.sunrise.hour) - timezoneOffset);
  sunrise.setMinutes(data.sun_phase.sunrise.minute);
  var sunset = new Date();
  sunset.setTime(forecastTime);
  sunset.setHours(parseInt(data.sun_phase.sunset.hour) - timezoneOffset);
  sunset.setMinutes(data.sun_phase.sunset.minute);
  if (forecastTime < sunrise || forecastTime > sunset) {
    isDay = 0;
  } else {
    isDay = 1;
  }

  if (time == "now") {
    weather = {
      city: data.current_observation.display_location.city,
      time: data.current_observation.observation_time,
      temp: data.current_observation.temp_f,
      feel: data.current_observation.feelslike_f,
      icon: data.current_observation.icon,
      wind: data.current_observation.wind_mph,
      isDay: isDay
    };
  } else {
    var forecast;
    data.hourly_forecast.forEach(function(hourlyForecast) {
      if (hourlyForecast.FCTTIME.epoch == time / 1000) {
        forecast = hourlyForecast;
      } 
    });
    weather = {
      city: data.current_observation.display_location.city,
      time: forecast.FCTTIME.pretty,
      temp: forecast.temp.english,
      feel: forecast.feelslike.english,
      icon: forecast.icon,
      wind: forecast.wspd.english,
      isDay: isDay
    };
  }
  return weather;
}

/**
 * Given a weather object, returns an array
 * with recommended clothing 
 */
function recommendClothes(weather) {
  var clothes = [];
  if (weather.feel <= 15) {
    clothes = ["heavy jacket", "tights", "gloves", "winter hat"];
  } else if (weather.feel <= 25) {
    clothes = ["light jacket", "tights", "gloves", "winter hat"];
  } else if (weather.feel <= 35) {
    clothes = ["light jacket", "tights", "gloves"];
  } else if (weather.feel <= 45) {
    clothes = ["long-sleeve shirt", "shorts"];
  } else {
    clothes = ["short-sleeve shirt", "shorts"];
  }

  var sunglassesWeather = ["clear", "hazy", "sunny", 
                           "mostlysunny", "partlycloudy"];
  if (weather.isDay && sunglassesWeather.indexOf(weather.icon) > -1) {
    clothes.push("sunglasses");
  }
  
  return clothes;
}

/* When the user clicks the change rules link, shows rules */
rulesLink.addEventListener("click", function(event) {
  event.preventDefault();
  showRules();
});

/* Shows rules */
function showRules() {
  locationDiv.style.display = "none";
  zipCodeInput.style.display = "none";
  setLocationButton.style.display = "none";
  timeSelect.style.display = "none";
  weatherDiv.style.display = "none";
  clothesDiv.style.display = "none";
  rulesLink.style.display = "none";
  
  var rulesTitleDiv = document.createElement("div");
  rulesTitleDiv.id = "rulesTitle";
  rulesTitleDiv.textContent = "Rules";
  containerDiv.appendChild(rulesTitleDiv);

  var thermometerDiv = document.createElement("div");
  thermometerDiv.id = "thermometer";
  containerDiv.appendChild(thermometerDiv);

  var heavyJacketDiv = document.createElement("div");
  heavyJacketDiv.className = "clothingRule";
  heavyJacketDiv.textContent = "heavy jacket";
  heavyJacketDiv.style.width = "30%";
  containerDiv.appendChild(heavyJacketDiv);

  var heavyJacketDescDiv = document.createElement("div");
  heavyJacketDescDiv.style.display = "none";
  heavyJacketDescDiv.innerHTML = "Wear a";
  var heavyJacketNameInput = document.createElement("input");
  heavyJacketNameInput.type = "text";
  heavyJacketNameInput.id = "heavyJacketName";
  heavyJacketNameInput.defaultValue = "heavy jacket";
  heavyJacketNameInput.size = "15";
  heavyJacketDescDiv.appendChild(heavyJacketNameInput);
  heavyJacketDescDiv.innerHTML += "when it feels cooler than";
  var heavyJacketFeelInput = document.createElement("input");
  heavyJacketFeelInput.type = "text";
  heavyJacketFeelInput.id = "heavyJacketFeel";
  heavyJacketFeelInput.defaultValue = "15";
  heavyJacketFeelInput.size = "5";
  heavyJacketDescDiv.appendChild(heavyJacketFeelInput);
  heavyJacketDescDiv.innerHTML += "&deg;F and it is...";
  containerDiv.appendChild(heavyJacketDescDiv);

  var conditions = ["daytime", "nighttime", "clear", "cloudy", "raining", "snowing"];
  conditions.forEach(function(condition) {
    var checkboxDiv = document.createElement("div");
    heavyJacketDescDiv.appendChild(checkboxDiv);
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = condition;
    checkboxDiv.appendChild(checkbox);
    var checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = condition;
    checkboxLabel.textContent = condition;
    checkboxDiv.appendChild(checkboxLabel);
  });

  var saveButton = document.createElement("button");
  saveButton.textContent = "Save and close";
  heavyJacketDescDiv.appendChild(saveButton);
  var closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  heavyJacketDescDiv.appendChild(closeButton);
  var deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  heavyJacketDescDiv.appendChild(deleteButton);

  heavyJacketDiv.addEventListener("click", function() {
    heavyJacketDescDiv.style.display = "block";
  });
}
