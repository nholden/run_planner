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
      var temp = currentTemp(zipCodeInput.value);
      tempDiv.textContent = "It is currently " + temp + " degrees in zip code " + zipCodeInput.value + "."; 
    } catch(err) {
      tempDiv.textContent = err;
    }
  });

  var tempDiv = document.createElement("div");
  document.body.appendChild(tempDiv);
}

// given a US zip code, returns the current temperature in degrees fahrenheit
function currentTemp(zipCode) {
  var req = new XMLHttpRequest();
  req.open("GET", "http://api.openweathermap.org/data/2.5/weather?zip=" 
           + zipCode + ",us&APPID=e3f7ff8b1714bf3efa20664e097b5387", false);
  req.send(null);
  if (req.status == 200) {
    var weatherData = JSON.parse(req.responseText);
    if (weatherData.cod == 200) {
      var temp = Math.round((weatherData.main.temp - 273.15)*1.8+32);
      return temp;
    } else {
      throw weatherData.message;
    }
  } else {
    throw req.statusText;
  }
}

buildLocationForm();
