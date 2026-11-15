"use strict";

let map = L.map("map").setView([60.25, 25], 10);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const resApi = "https://media2.edu.metropolia.fi/restaurant/api/v1";

const table = document.getElementsByTagName("table")[0];
const dialog = document.getElementsByTagName("dialog")[0];
dialog.setAttribute("id", "modal");
let rowList = [];

async function fetchRestaurants() {
  const response = await fetch(resApi + "/restaurants");
  if (!response.ok) {
    dialog.showModal();
    throw new Error("Error fetching restaurants: " + response.status);
  }
  const jsonData = await response.json();
  return await jsonData;
}

async function fetchMenu(id) {
  const response = await fetch(resApi + "/restaurants/daily/" + id + "/en");

  if (!response.ok) {
    dialog.showModal();
    throw new Error("Error fetching daily menu: " + response.status);
  }
  const jsonData = await response.json();
  return await jsonData;
}

const renderDailyMenu = (courses) => {
  const menuElem = document.createElement("div");
  const ul = document.createElement("ul");
  menuElem.append(ul);
  for (const course of courses) {
    const singleCourse = document.createElement("li");
    singleCourse.setAttribute("id", "singleCourse");
    const name = document.createElement("p");
    const price = document.createElement("p");
    const diets = document.createElement("p");
    name.textContent = course.name;
    price.textContent = "Price: " + course.price;
    diets.textContent =
      "Allergens: " + (course.diets === undefined ? "-" : course.diets);

    singleCourse.append(name);
    singleCourse.append(price);
    singleCourse.append(diets);
    ul.append(singleCourse);
  }
  return menuElem;
};

async function displayRestaurants() {
  try {
    const apiRestaurants = await fetchRestaurants();
    apiRestaurants.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else {
        return 1;
      }
    });

    // showRestaurantsOnMap();

    for (const res of apiRestaurants) {
      const row = document.createElement("tr");
      row.addEventListener("click", async () => {
        for (const r of rowList) {
          r.classList.remove("highlight");
        }
        row.classList.add("highlight");

        dialog.showModal();
        dialog.addEventListener("click", () => {
          dialog.close();
        });

        const dialogBox = document.createElement("div");
        dialogBox.setAttribute("id", "dialogBox");
        const dialogLeft = document.createElement("div");
        const dialogName = document.createElement("p");
        const dialogAddress = document.createElement("p");
        const dialogPostal = document.createElement("p");
        const dialogCity = document.createElement("p");
        const dialogPhone = document.createElement("p");
        const dialogCompany = document.createElement("p");
        const dialogEmpty = document.createElement("p");
        const dialogClose = document.createElement("p");

        dialogName.textContent = "Restaurant name: " + res.name;
        dialogAddress.textContent = "Address: " + res.address;
        dialogPostal.textContent = "Postal code: " + res.postalCode;
        dialogCity.textContent = "City: " + res.city;
        dialogPhone.textContent = "Phone number: " + res.phone;
        dialogCompany.textContent = "Company: " + res.company;
        dialogEmpty.innerHTML = "&nbsp;";
        dialogClose.textContent = "CLICK ANYWHERE TO CLOSE";
        dialogLeft.append(dialogName);
        dialogLeft.append(dialogAddress);
        dialogLeft.append(dialogPostal);
        dialogLeft.append(dialogCity);
        dialogLeft.append(dialogPhone);
        dialogLeft.append(dialogCompany);
        dialogLeft.append(dialogEmpty);
        dialogLeft.append(dialogClose);

        const menu = await fetchMenu(res._id);
        const dialogRight = renderDailyMenu(menu.courses);

        dialogBox.append(dialogLeft);
        dialogBox.append(dialogRight);
        dialog.replaceChild(dialogBox, dialog.childNodes[0]);
      });
      const name = document.createElement("td");
      const address = document.createElement("td");

      name.textContent = res.name;
      address.textContent = res.address + ", " + res.city;

      row.append(name);
      row.append(address);
      rowList.push(row);
      table.append(row);

      let marker = L.marker([
        res.location.coordinates[1],
        res.location.coordinates[0],
      ])
        .addTo(map)
        .addEventListener("click", () =>
          marker.bindPopup(
            `<h3>${res.name}</h3><p>${res.address}, ${res.city}</p>`,
          ),
        );
    }
  } catch (error) {
    dialog.textContent = error.message;
    dialog.showModal();
    console.log(error.message);
  }
}

displayRestaurants();

function showRestaurantsOnMap() {
  if (apiRestaurants) {
    for (const res of apiRestaurants) {
      let marker = L.marker([
        res.location.coordinates[1],
        res.location.coordinates[0],
      ])
        .addTo(map)
        .addEventListener("click", () =>
          marker.bindPopup(
            `<h3>${res.name}</h3><p>${res.address}, ${res.city}</p>`,
          ),
        );
    }
  }
}
