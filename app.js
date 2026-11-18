"use strict";

const resApi = "https://media2.edu.metropolia.fi/restaurant/api/v1";

const table = document.getElementsByTagName("table")[0];
const dialog = document.getElementsByTagName("dialog")[0];
dialog.setAttribute("id", "modal");
let rowList = [];

let map = L.map("map").setView([60.25, 24.9], 10);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

async function fetchRestaurants() {
  const response = await fetch(resApi + "/restaurants");
  if (!response.ok) {
    dialog.showModal();
    throw new Error("Error fetching restaurants: " + response.status);
  }
  const jsonData = await response.json();
  return await jsonData;
}

async function fetchDaily(id) {
  const response = await fetch(resApi + "/restaurants/daily/" + id + "/en");

  if (!response.ok) {
    dialog.showModal();
    throw new Error("Error fetching daily menu: " + response.status);
  }
  const jsonData = await response.json();
  return await jsonData;
}

async function fetchWeekly(id) {
  const response = await fetch(resApi + "/restaurants/weekly/" + id + "/en");

  if (!response.ok) {
    dialog.showModal();
    throw new Error("Error fetching weekly menu: " + response.status);
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
    price.textContent = `Price: ${!course.price ? "-" : course.price}`;
    diets.textContent = "Allergens: " + (!course.diets ? "-" : course.diets);

    singleCourse.append(name);
    singleCourse.append(price);
    singleCourse.append(diets);
    ul.append(singleCourse);
  }
  return menuElem;
};

const renderWeeklyMenu = (days) => {
  console.log(days);
  console.log(new Date().getDay());
  const dayElem = document.createElement("div");
  const menuElem = document.createElement("div");
  for (const day of days) {
    const dayButton = document.createElement("button");
    // dayButton.setAttribute("id");
    dayButton.textContent = day.date.slice(0, 3);
    dayElem.append(dayButton);
  }
  const ul = document.createElement("ul");
  for (const course of days) {
    const singleCourse = document.createElement("li");
    singleCourse.setAttribute("id", "singleCourse");
    const name = document.createElement("p");
    const price = document.createElement("p");
    const diets = document.createElement("p");
    name.textContent = course.name;
    price.textContent = `Price: ${!course.price ? "-" : course.price}`;
    diets.textContent = "Allergens: " + (!course.diets ? "-" : course.diets);

    singleCourse.append(name);
    singleCourse.append(price);
    singleCourse.append(diets);
    ul.append(singleCourse);
  }
  menuElem.append(ul);
  return dayElem;
};

async function buildModal(restaurant, type) {
  const dialogBox = document.createElement("div");
  dialogBox.setAttribute("id", "dialogBox");

  const dialogClose = document.createElement("button");
  const dialogTop = document.createElement("div");
  const dialogName = document.createElement("p");
  const dialogAddress = document.createElement("p");
  const dialogPostal = document.createElement("p");
  const dialogCity = document.createElement("p");
  const dialogPhone = document.createElement("p");
  const dialogCompany = document.createElement("p");

  dialogClose.textContent = "X";
  dialogClose.setAttribute("id", "dialogClose");

  dialogName.textContent = `Restaurant name: ${restaurant.name}`;
  dialogAddress.textContent = `Address: ${restaurant.address}, ${restaurant.postalCode}, ${restaurant.city}`;
  dialogPhone.textContent = `Phone number: ${restaurant.phone}, Company: ${restaurant.company}`;
  dialogTop.append(dialogClose);
  dialogTop.append(dialogName);
  dialogTop.append(dialogAddress);
  dialogTop.append(dialogPostal);
  dialogTop.append(dialogCity);
  dialogTop.append(dialogPhone);
  dialogTop.append(dialogCompany);

  if (type === "daily") {
    const menu = await fetchDaily(restaurant._id);
    const dialogBottom = renderDailyMenu(menu.courses);
    dialogBox.append(dialogTop);
    dialogBox.append(dialogBottom);
  } else {
    const menu = await fetchWeekly(restaurant._id);
    const dialogBottom = renderWeeklyMenu(menu.days);
    dialogBox.append(dialogTop);
    dialogBox.append(dialogBottom);
  }

  dialog.replaceChild(dialogBox, dialog.childNodes[0]);

  dialogClose.addEventListener("click", () => {
    for (const r of rowList) {
      r.classList.remove("highlight");
    }
    dialog.close();
  });
}

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

    for (const res of apiRestaurants) {
      const row = document.createElement("tr");
      const name = document.createElement("td");
      const address = document.createElement("td");
      const daily = document.createElement("td");
      const weekly = document.createElement("td");
      const dailyButton = document.createElement("button");
      const weeklyButton = document.createElement("button");

      dailyButton.addEventListener("click", async () => {
        row.classList.add("highlight");

        dialog.showModal();
        buildModal(res, "daily");
      });

      weeklyButton.addEventListener("click", async () => {
        row.classList.add("highlight");

        dialog.showModal();
        buildModal(res, "weekly");
      });

      name.textContent = res.name;
      address.textContent = res.address + ", " + res.city;
      dailyButton.textContent = "Daily";
      dailyButton.setAttribute("id", "tableCustom");
      weeklyButton.textContent = "Weekly";
      weeklyButton.setAttribute("id", "tableCustom");

      daily.append(dailyButton);
      weekly.append(weeklyButton);

      row.append(name);
      row.append(address);
      row.append(daily);
      row.append(weekly);
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

// function showRestaurantsOnMap() {
//   if (apiRestaurants) {
//     for (const res of apiRestaurants) {
//       let marker = L.marker([
//         res.location.coordinates[1],
//         res.location.coordinates[0],
//       ])
//         .addTo(map)
//         .addEventListener("click", () =>
//           marker.bindPopup(
//             `<h3>${res.name}</h3><p>${res.address}, ${res.city}</p>`,
//           ),
//         );
//     }
//   }
// }
