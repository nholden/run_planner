function buildLocationForm () {
  var locationForm = document.createElement("form");
  var zipCodeInput = document.createElement("input");
  zipCodeInput.type = "text";
  zipCodeInput.id = "zipCode";
  zipCodeInput.placeholder = "Zip code";
  locationForm.appendChild(zipCodeInput);
  var locationSubmit = document.createElement("button");
  locationSubmit.type = "submit";
  locationSubmit.textContent = "Set location";
  locationForm.appendChild(locationSubmit);
  document.body.appendChild(locationForm);
}

buildLocationForm();
