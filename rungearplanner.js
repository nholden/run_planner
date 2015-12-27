/* Assigns variables to page elements accessed throughout code. */
var enterLocationView = document.querySelector("#enterLocationView");
var zipCodeInput = document.querySelector("#zipCode");
var mainView = document.querySelector("#mainView");
var timeSelect = document.querySelector("#time");
var editRulesView = document.querySelector("#editRulesView");
var rulesDiv = document.querySelector("#rules");
var citySpan = document.querySelector("#city");

/** 
 * Checks local storage for saved rules.
 * If none saved, sets rules to default. 
 */
var rules = localStorage.getItem("rules");
if (rules) {
  rules = JSON.parse(rules);
} else {
  resetRules();
}

/**
 * Checks local storage for a saved zip code. If found and
 * successfully able to update the page, shows the main view.
 * Otherwise, shows the enter location view.
 */
var weatherInZip, savedZip = localStorage.getItem("zipCode");
if (savedZip) {
  weatherInZip = getWeatherInZip(savedZip);
  if (update()) {
    showMainView();
  }
} else {
  showEnterLocationView();
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

/* Sets settings menu to closed by defaut */
var settingsOpen = false;

/* Toggles settings menu */
function toggleSettings() {
  var settings = document.querySelector("#settings");
  if (settingsOpen) {
    settings.style.display = "none";
    settingsOpen = false;
  } else {
    settings.style.display = "block";
    settingsOpen = true;
  }
}

/* Toggles settings menu when button clicked */
document.querySelector("#settingsButton").addEventListener("click", function() {
  toggleSettings();
});
    
/* Shows page elements associated with entering location. */
function showEnterLocationView() {
  resetTimeOptions();
  enterLocationView.style.display = "block";
  mainView.style.display = "none";
  editRulesView.style.display = "none";
}

/**
 * When the user clicks the set location button, saves 
 * zip code to local storage and shows the main view. 
 */
document.querySelector("#setLocation").addEventListener("click", function(event) {
  event.preventDefault();
  if (update()) {
    localStorage.setItem("zipCode", zipCodeInput.value);
    showMainView();
  }
});

/** 
 * Generate time options based on time zone
 * in zip code and shows the main view. 
 */
function showMainView() {
  resetTimeOptions();

  next24Hours(new Date()).forEach(function(hour) {
    var hourOption = document.createElement("option");
    hourOption.value = hour.getTime();
    hourOption.textContent = hour12Format(hour);
    timeSelect.appendChild(hourOption);
  });

  enterLocationView.style.display = "none";
  mainView.style.display = "block";
  editRulesView.style.display = "none";
} 

/* Removes all options from time select and rebuilds now option */
function resetTimeOptions() {
  while (timeSelect.childElementCount > 1) {
    timeSelect.removeChild(timeSelect.lastChild);
  }
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

/* When user chooses a different time, updates the page. */
timeSelect.addEventListener("change", function() {
  update();
});

/**
 * Updates the location, weather, and clothing recommendation
 * elements on the page based on the user's inputs.
 */
function update() {
  var errorDiv = document.querySelector("#error");
  var clothesDiv = document.querySelector("#clothes");
  try {
    if (!weatherInZip) {
      if (zipCodeInput.value.match(/^\d{5}$/)) {
        weatherInZip = getWeatherInZip(zipCodeInput.value);
      } else {
        throw "Zip code must be five digits.";
      }
    }
    var weather = getWeatherAtTime(weatherInZip, timeSelect.value);
    citySpan.textContent = weather.city;
    var weatherIconClass = "wi wi-wu-";
    if (!weather.isDay) {
      weatherIconClass += "night-";
    }
    weatherIconClass += weather.icon;
    document.querySelector("#weather").innerHTML = 
      "<div id='temp'>" + weather.temp + "&deg;F</div>" +
      "<div id='cond'><i class='" + weatherIconClass + "'></i></div>" +
      "<div id='wind'>" + weather.wind + " mph</div>";
    var clothesList = document.createElement("ul");
    clothesDiv.textContent = "You should wear:";
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

/**
 * Given a weather object, returns an array
 * with recommended clothing 
 */
function recommendClothes(weather) {
  var clothes = [];
  var clearIcons = ["clear", "hazy", "mostlysunny",
                    "partlycloudy", "sunny"];
  var cloudyIcons = ["cloudy", "fog", "mostlycloudy",
                     "partlysunny", ];
  var rainingIcons = ["chancerain", "chancesleet", "chancetstorms",

                      "sleet", "rain", "tstorms"];
  var snowingIcons = ["chanceflurries", "chancesnow", "flurries",
                      "snow" ];

  rules.forEach(function(rule) {
    if (parseFloat(rule.minFeel) <= parseFloat(weather.feel) && 
        parseFloat(rule.maxFeel) > parseFloat(weather.feel)) {
      if (weather.isDay && rule.day || !weather.isDay && rule.night) {
        if (rule.clear && clearIcons.indexOf(weather.icon) > -1 ||
            rule.cloudy && cloudyIcons.indexOf(weather.icon) > -1 ||
            rule.raining && rainingIcons.indexOf(weather.icon) > -1 ||
            rule.snowing && snowingIcons.indexOf(weather.icon) > -1) {
          clothes.push(rule.name); 
        }
      }
    }
  });

  return clothes;
}

/**
 * When the user clicks name of city, removes zip code
 * from local storage and shows enter location view.
 */
document.querySelector("#location").addEventListener("click", function(event) {
  event.preventDefault();
  localStorage.removeItem("zipCode");
  weatherInZip = null;
  showEnterLocationView();
  citySpan.textContent = "";
  toggleSettings();
});

/* When the user clicks the change rules link, shows edit rules view */
document.querySelector("#rulesLink").addEventListener("click", function(event) {
  event.preventDefault();
  showEditRulesView();
  toggleSettings();
});

/* Shows edit rules view and rebuilds rule page elements from rules variable */
function showEditRulesView() {
  removeRules(); 
  enterLocationView.style.display = "none";
  mainView.style.display = "none";
  editRulesView.style.display = "block";
  
  rules.forEach(function(item, index) {
    buildRule(item, index);
  });
}

/* When user clicks add rule link, adds rule */
document.querySelector("#addRuleLink").addEventListener("click", function(event) {
  event.preventDefault();
  buildRule(new Item("new item"), rules.length);
  var allRuleBarDivs = document.querySelectorAll(".clothingBar");
  var newRuleBarDiv = allRuleBarDivs[allRuleBarDivs.length - 1];
  newRuleBarDiv.getElementsByTagName("i")[0].className = "fa fa-caret-down";
  var newRuleCriteriaDiv = document.querySelector("#clothingCriteria" + rules.length);
  newRuleCriteriaDiv.style.display = "block";
});

/** 
 * Adds functionality to save, cancel, and reset buttons. When weather data 
 * exists, returns to main view. Otherwise, returns to enter location view.
 */
document.querySelector("#save").addEventListener("click", function() {
  saveRules();
  if (weatherInZip) {
    showMainView();
    update();
  } else {
    showEnterLocationView();
  }
});

document.querySelector("#cancel").addEventListener("click", function() {
  if (weatherInZip) {
    showMainView();
    update();
  } else {
    showEnterLocationView();
  }
});

document.querySelector("#reset").addEventListener("click", function() {
  resetRules();
  if (weatherInZip) {
    showMainView();
    update();
  } else {
    showEnterLocationView();
  }
});

/* Resets rules to default. */
function resetRules() {
  localStorage.removeItem("rules");
  rules = [
    {
      name: "winter hat",
      minFeel: -50,
      maxFeel: 35,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    { 
      name: "baseball cap",
      minFeel: 35,
      maxFeel: 150,
      day: true,
      night: true,
      clear: false,
      cloudy: false,
      raining: true,
      snowing: false
    },
    {
      name: "sunglasses",
      minFeel: -50,
      maxFeel: 150,
      day: true,
      night: false,
      clear: true,
      cloudy: false,
      raining: false,
      snowing: false
    },
    {
      name: "gloves",
      minFeel: -50,
      maxFeel: 40,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    {
      name: "heavy jacket",
      minFeel: -50,
      maxFeel: 20,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    {
      name: "light jacket",
      minFeel: 20,
      maxFeel: 35,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    {
      name: "long-sleeve shirt",
      minFeel: -50,
      maxFeel: 45,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    {
      name: "short-sleeve shirt",
      minFeel: 45,
      maxFeel: 150,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    {
      name: "tights",
      minFeel: -50,
      maxFeel: 35,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    },
    { 
      name: "shorts",
      minFeel: 35,
      maxFeel: 150,
      day: true,
      night: true,
      clear: true,
      cloudy: true,
      raining: true,
      snowing: true
    }
  ];
}

/* Constructs a new item object */
function Item(name) {
  this.name = name;
  this.minFeel = "";
  this.maxFeel = "";
  this.day = false;
  this.night = false;
  this.clear = false;
  this.cloudy = false;
  this.raining = false;
  this.snowing = false;
}

/* Creates page elements for a rule given an item */
function buildRule(item, index) {
  var itemDiv = document.createElement("div");
  itemDiv.className = "clothingRule";
  itemDiv.style.margin = "0.5em 0";
  rulesDiv.appendChild(itemDiv);

  var itemBarDiv = document.createElement("div");
  itemBarDiv.className = "clothingBar";
  updateItemBarBG(item.minFeel, item.maxFeel);
  itemDiv.appendChild(itemBarDiv);

  var itemBarCaret = document.createElement("i");
  itemBarCaret.className = "fa fa-caret-right";
  itemBarDiv.appendChild(itemBarCaret);

  itemBarDiv.innerHTML += " " + item.name;

/** 
 * Given a minimum feel temp and a maximum feel temp,
 * updates the background color of itemBarDiv to reflect
 * where along the thermometer the rule falls.
 */
  function updateItemBarBG(minFeel, maxFeel) {
    var itemBarDivStartPercent = (parseInt(minFeel) + 20)/1.4;
    var itemBarDivEndPercent = (parseInt(maxFeel) + 20)/1.4;
    itemBarDiv.style.background = "linear-gradient(to right, transparent, transparent " +
                                  itemBarDivStartPercent + "%, rgba(255,255,255,0.3) " + 
                                  itemBarDivStartPercent + "%, rgba(255,255,255,0.3) " + 
                                  itemBarDivEndPercent + "%, transparent " +
                                  itemBarDivEndPercent + "%, transparent 100%)";
  }

  var itemCriteriaDiv = document.createElement("div");
  itemDiv.appendChild(itemCriteriaDiv);
  itemCriteriaDiv.className = "clothingCriteria";
  itemCriteriaDiv.id = "clothingCriteria" + index;
  itemCriteriaDiv.style.display = "none";

  var textSpan0 = document.createElement("span");
  textSpan0.innerHTML = "Wear";
  itemCriteriaDiv.appendChild(textSpan0);

  var itemNameInput = document.createElement("input");
  itemNameInput.type = "text";
  itemNameInput.className = "itemName";
  itemNameInput.defaultValue = item.name;
  itemNameInput.size = "15";
  itemNameInput.addEventListener("input", function() {
    itemBarDiv.textContent = itemNameInput.value;
  });
  itemCriteriaDiv.appendChild(itemNameInput);

  var textSpan1 = document.createElement("span");
  textSpan1.innerHTML = "when it feels warmer than or equal to";
  itemCriteriaDiv.appendChild(textSpan1);

  var itemMinFeelInput = document.createElement("input");
  itemMinFeelInput.type = "text";
  itemMinFeelInput.className = "itemMinFeel";
  itemMinFeelInput.defaultValue = item.minFeel;
  itemMinFeelInput.size = "5";
  itemMinFeelInput.addEventListener("change", function() {
    updateItemBarBG(itemMinFeelInput.value, itemMaxFeelInput.value);
  });
  itemCriteriaDiv.appendChild(itemMinFeelInput);

  var textSpan2 = document.createElement("span");
  textSpan2.innerHTML = "&deg;F and it feels cooler than";
  itemCriteriaDiv.appendChild(textSpan2);

  var itemMaxFeelInput = document.createElement("input");
  itemMaxFeelInput.type = "text";
  itemMaxFeelInput.className = "itemMaxFeel";
  itemMaxFeelInput.defaultValue = item.maxFeel;
  itemMaxFeelInput.size = "5";
  itemMaxFeelInput.addEventListener("change", function() {
    updateItemBarBG(itemMinFeelInput.value, itemMaxFeelInput.value);
  });
  itemCriteriaDiv.appendChild(itemMaxFeelInput);

  var textSpan3 = document.createElement("span");
  textSpan3.innerHTML = "&deg;F and it is...";
  itemCriteriaDiv.appendChild(textSpan3);

  var conditions = ["day", "night", "clear", "cloudy", "raining", "snowing"];
  conditions.forEach(function(condition) {
    var checkboxDiv = document.createElement("div");
    itemCriteriaDiv.appendChild(checkboxDiv);
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = condition;
    checkbox.checked = item[condition];
    checkboxDiv.appendChild(checkbox);
    var checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = condition;
    checkboxLabel.textContent = condition;
    checkboxDiv.appendChild(checkboxLabel);
  });

  var deleteDiv = document.createElement("div");
  itemCriteriaDiv.appendChild(deleteDiv);
  var deleteLink = document.createElement("a");
  deleteLink.innerHTML = "<i class='fa fa-minus'></i> Delete";
  deleteLink.href = "";
  deleteDiv.appendChild(deleteLink);
  deleteLink.addEventListener("click", function(event) {
    event.preventDefault();
    rulesDiv.removeChild(itemDiv);
  });

  itemBarDiv.addEventListener("click", function() {
    var allItemCriteriaDivs = document.querySelectorAll(".clothingCriteria");
    var allItemBarDivs = document.querySelectorAll(".clothingBar");
    var wasHidden = itemCriteriaDiv.style.display == "none";
    for (var i = 0; i < allItemCriteriaDivs.length; i++) {
      allItemCriteriaDivs[i].style.display = "none";
      allItemBarDivs[i].getElementsByTagName("i")[0].className = "fa fa-caret-right";
    }
    if (wasHidden) {
      this.getElementsByTagName("i")[0].className = "fa fa-caret-down";
      itemCriteriaDiv.style.display = "block";
    }
  });
}

/** 
 * Sets rules to reflect the current values of 
 * the rules inputs and saves to local storage.
 */
function saveRules() {
  var newRules = [];
  var rulesDivs = document.querySelectorAll(".clothingRule"); 
  for (var i = 0; i < rulesDivs.length; i++) {
    newRules.push({
     name: rulesDivs[i].querySelector(".itemName").value,
      minFeel: rulesDivs[i].querySelector(".itemMinFeel").value,
      maxFeel: rulesDivs[i].querySelector(".itemMaxFeel").value,
      day: rulesDivs[i].querySelector("#day").checked,
      night: rulesDivs[i].querySelector("#night").checked,
      clear: rulesDivs[i].querySelector("#clear").checked,
      cloudy: rulesDivs[i].querySelector("#cloudy").checked,
      raining: rulesDivs[i].querySelector("#raining").checked,
      snowing: rulesDivs[i].querySelector("#snowing").checked
    });
  }
  rules = newRules;
  localStorage.setItem("rules", JSON.stringify(rules));
}

/* Removes any existing rule page elements */
function removeRules() {
  var rulesDivs = document.querySelectorAll(".clothingRule"); 
  if (rulesDivs) {
    for (var i = 0; i < rulesDivs.length; i++) {
      rulesDiv.removeChild(rulesDivs[i]);
    }
  }
}
