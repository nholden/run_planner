function buildLocationForm() {
  var container = document.createElement("div");
  container.id = "container";
  document.body.appendChild(container);
 
  var locationForm = document.createElement("form");
  container.appendChild(locationForm);
 
  var zipCodeInput = document.createElement("input");
  zipCodeInput.type = "text";
  zipCodeInput.id = "zipCode";
  zipCodeInput.placeholder = "Zip code";
  locationForm.appendChild(zipCodeInput);

  var timeSelect = document.createElement("select");
  timeSelect.id = "time";
  locationForm.appendChild(timeSelect);

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

  var submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Set location";
  submit.id = "submit";
  locationForm.appendChild(submit);
  submit.addEventListener("click", function(event) {
    event.preventDefault();
    try {
      if (timeSelect.value == "now") {
        var weather = currentWeather(zipCodeInput.value);
      } else {
        var weather = forecastedWeather(zipCodeInput.value, timeSelect.value);
      }
      weatherDiv.innerHTML = "Weather in zip code " + zipCodeInput.value +
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

var weatherApiRootUrl = "http://api.openweathermap.org/data/2.5/";
var weatherApiKey = "e3f7ff8b1714bf3efa20664e097b5387";

/**
 * given a US zip code, returns an object with temp,
 * cond, and wind properties for current weather
 */
function currentWeather(zipCode) {
  var req = new XMLHttpRequest();
  req.open("GET", weatherApiRootUrl + "weather?zip=" + zipCode +
           ",us&units=imperial&APPID=" + weatherApiKey, false);
  req.send(null);
  if (req.status == 200) {
    var data = JSON.parse(req.responseText);
    if (data.cod == 200) {
      var weather = {
        temp: Math.round(data.main.temp),
        cond: data.weather[0].main,
        wind: data.wind.speed
      };
      return weather;
    } else {
      throw data.message;
    }
  } else {
    throw req.statusText;
  }
}

/**
 * given a US zip code and a unix time (UTC), returns an object
 * with time and forecasted temp, cond, and wind properties
 */
function forecastedWeather(zipCode, time) {
  var req = new XMLHttpRequest();
  req.open("GET", weatherApiRootUrl + "forecast?zip=" + zipCode +
           ",us&units=imperial&APPID=" + weatherApiKey, false);
  req.send(null);
  if (req.status == 200) {
    var data = JSON.parse(req.responseText);
    if (data.cod == 200) {
      var closestForecast;
      time = time/1000;
      data.list.forEach(function(forecast) {
        if (!closestForecast || Math.abs(forecast.dt - time) < Math.abs(closestForecast.dt - time)) {
          closestForecast = forecast;
        } 
      });
      var weather = {
        time: closestForecast.dt * 1000,
        temp: Math.round(closestForecast.main.temp),
        cond: closestForecast.weather[0].main,
        wind: closestForecast.wind.speed
      };
      return weather;
    } else {
      throw data.message;
    }
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
