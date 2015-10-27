function buildLocationForm () {
  var locationForm = document.createElement("form");
  document.body.appendChild(locationForm);
 
  var zipCodeInput = document.createElement("input");
  zipCodeInput.type = "text";
  zipCodeInput.id = "zipCode";
  zipCodeInput.placeholder = "Zip code";
  locationForm.appendChild(zipCodeInput);

  var locationSubmit = document.createElement("button");
  locationSubmit.type = "submit";
  locationSubmit.textContent = "Set location";
  locationForm.appendChild(locationSubmit);
  locationSubmit.addEventListener("click", function(event) {
    event.preventDefault();
    try {
      var weather = currentWeather(zipCodeInput.value);
      weatherDiv.innerHTML = "Weather in zip code " + zipCodeInput.value +
                             "<br>Temperature: " + weather.temp + "&deg;F" +
                             "<br>Conditions: " + weather.cond +
                             "<br>Wind speed: " + weather.wind + " mph";
      var clothes = recommendClothes(weather);
      var clothesHTML = "";
      for (var bodyPart in clothes) {
        clothesHTML += "<br>Wear " + clothes[bodyPart] + " on your " + bodyPart + ".";
      }
      clothesDiv.innerHTML = "Clothing recommendations" + clothesHTML;
    } catch(err) {
      weatherDiv.textContent = err;
      clothesDiv.textContent = null;
    }
  });

  var weatherDiv = document.createElement("div");
  document.body.appendChild(weatherDiv);

  var clothesDiv = document.createElement("div");
  document.body.appendChild(clothesDiv);
}

// given a US zip code, returns object with temp, cond, and wind properties
function currentWeather(zipCode) {
  var req = new XMLHttpRequest();
  req.open("GET", "http://api.openweathermap.org/data/2.5/weather?zip=" + zipCode +
           ",us&units=imperial&APPID=e3f7ff8b1714bf3efa20664e097b5387", false);
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

// given a weather object, returns an object with body parts as keys and clothing as values
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
