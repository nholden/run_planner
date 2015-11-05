function buildLocationForm() {
  var container = document.createElement("div");
  container.id = "container";
  document.body.appendChild(container);

  var locationDisplay = document.createElement("div");
  locationDisplay.id = "locationDisplay";
  locationDisplay.textContent = "Running in ";
  container.appendChild(locationDisplay);
  var cityLink = document.createElement("a");
  cityLink.href = "";
  locationDisplay.appendChild(cityLink);
 
  var locationForm = document.createElement("form");
  container.appendChild(locationForm);
 
  var zipCodeInput = document.createElement("input");
  zipCodeInput.type = "text";
  zipCodeInput.id = "zipCode";
  zipCodeInput.placeholder = "Zip code";
  locationForm.appendChild(zipCodeInput);

  var submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Set location";
  submit.id = "submit";
  locationForm.appendChild(submit);
  submit.addEventListener("click", function(event) {
    event.preventDefault();
    zipCodeInput.style.display = "none";
    submit.style.display = "none";
    locationDisplay.style.display = "block";
    timeSelect.style.display = "block";
    updateWeather();
  });

  var timeSelect = document.createElement("select");
  timeSelect.id = "time";
  locationForm.appendChild(timeSelect);
  timeSelect.addEventListener("change", function() {
    updateWeather();
  });

  function updateWeather() {
    try {
      if (timeSelect.value == "now") {
        var weather = getWeather(zipCodeInput.value);
      } else {
        var weather = getWeather(zipCodeInput.value, timeSelect.value);
      } 
      cityLink.textContent = weather.city;
      weatherDiv.innerHTML = "Weather in zip code " + zipCodeInput.value +
                             "<br>" + weather.time +
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
    } catch(err) {
      weatherDiv.textContent = err;
      clothesDiv.textContent = null;
    }
  }
  

  var now = new Date();
  var nowOption = document.createElement("option");
  nowOption.value = "now";
  nowOption.textContent = "Now";
  timeSelect.appendChild(nowOption);

  next24Hours(now).forEach(function(hour) {
    var hourOption = document.createElement("option");
    hourOption.value = hour.getTime();
    hourOption.textContent = hour12Format(hour);
    timeSelect.appendChild(hourOption);
  });

  var weatherDiv = document.createElement("div");
  container.appendChild(weatherDiv);

  var clothesDiv = document.createElement("div");
  container.appendChild(clothesDiv);
}

/** 
 * given a date object, rounds down to the nearest hour and
 * returns an array of date objects for the next 24 hours
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
 * given a date object, return a string with
 * the hour in 12-hour format
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

var weatherApiRootUrl = "http://api.wunderground.com/api/585c642644dd880e/";

/**
 * Given a US zip code and a unix time (UTC), returns an object
 * with city, time and forecasted temp, cond, and wind properties. 
 * If time is undefined, returns the current conditions.
 */
function getWeather(zipCode, time) {
  var req = new XMLHttpRequest();
  req.open("GET", weatherApiRootUrl + "conditions/hourly/q/"
           + zipCode + "/q.json", false);
  req.send(null);
  if (req.status == 200) {
    var data = JSON.parse(req.responseText), weather;
    if (time) {
      if (data.hourly_forecast) {
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
      } else {
        throw data.response.error.description;
      }
    } else {
      if (data.current_observation) {
        weather = {
          city: data.current_observation.display_location.city,
          time: data.current_observation.observation_time,
          temp: data.current_observation.temp_f,
          cond: data.current_observation.weather,
          wind: data.current_observation.wind_mph
        };
      } else {
        throw data.response.error.description;
      }
    }
    return weather;
  } else {
    throw req.statusText;
  }
}

/**
 * given a weather object, returns an object with
 * body parts as keys and clothing as values
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

buildLocationForm();
