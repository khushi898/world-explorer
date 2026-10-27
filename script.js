/* ==========================================
   WORLD EXPLORER — MILESTONE 2
   Complete Vanilla JavaScript
========================================== */

// DOM ELEMENTS
const countriesContainer = document.getElementById("countries-container");
const searchInput = document.getElementById("search-input");
const regionFilter = document.getElementById("region-filter");
const sortSelect = document.getElementById("sort-select");

const allCountriesBtn = document.getElementById("all-countries-btn");
const favouritesBtn = document.getElementById("favourites-btn");
const compareViewBtn = document.getElementById("compare-view-btn");

const countriesSection = document.getElementById("explore");
const countryDetails = document.getElementById("country-details");
const detailsContainer = document.getElementById("details-container");
const backBtn = document.getElementById("back-btn");

const compareSection = document.getElementById("compare-section");
const compareBackBtn = document.getElementById("compare-back-btn");
const compareCountry1 = document.getElementById("compare-country-1");
const compareCountry2 = document.getElementById("compare-country-2");
const compareBtn = document.getElementById("compare-btn");
const compareResults = document.getElementById("compare-results");

const totalCountries = document.getElementById("total-countries");
const totalRegions = document.getElementById("total-regions");
const totalFavourites = document.getElementById("total-favourites");
const resultsCount = document.getElementById("results-count");
const refreshBtn = document.getElementById("refresh-btn");

// APPLICATION STATE
let allCountries = [];
let currentView = "all";
let isLoading = false;

const STORAGE_KEY = "worldExplorerFavourites";

let favourites = [];

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  favourites = Array.isArray(saved)
    ? [...new Set(saved.filter((code) => typeof code === "string"))]
    : [];
} catch (error) {
  console.error("Unable to read favourites:", error);
}

// REST COUNTRIES API
// Keep the existing working API proxy.
const API_URL =
  "https://pw-d20261017a29.plainwork-apps.workers.dev/v3.1/all?fields=name,flags,capital,population,cca3,region,subregion,area,currencies,languages,borders,maps,timezones,idd,car,landlocked,independent,unMember,tld,continents";

// HELPERS
function formatNumber(value) {
  return typeof value === "number"
    ? value.toLocaleString("en-GB")
    : "N/A";
}

function formatList(values) {
  return Array.isArray(values) && values.length
    ? values.join(", ")
    : "N/A";
}

function getCurrencyNames(country) {
  return Object.entries(country.currencies || {}).map(
    ([code, currency]) =>
      currency?.name
        ? `${currency.name} (${code})`
        : code
  );
}

function getLanguages(country) {
  return Object.values(country.languages || {});
}

function getCallingCode(country) {
  const root = country.idd?.root;
  const suffixes = country.idd?.suffixes;

  if (!root) return "N/A";

  if (!Array.isArray(suffixes) || suffixes.length === 0) {
    return root;
  }

  if (suffixes.length > 5) {
    return `${root} (multiple area codes)`;
  }

  return suffixes.map((suffix) => `${root}${suffix}`).join(", ");
}

function getFlag(country) {
  return country.flags?.svg || country.flags?.png || "";
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function scrollToSection(section) {
  section.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start"
  });
}

// SAVE FAVOURITES
function saveFavourites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  } catch (error) {
    console.error("Unable to save favourites:", error);
  }

  updateStatistics();
}

// LIVE STATISTICS
function updateStatistics() {
  totalCountries.textContent = allCountries.length
    ? formatNumber(allCountries.length)
    : "—";

  totalRegions.textContent = allCountries.length
    ? new Set(allCountries.map((country) => country.region).filter(Boolean)).size
    : "—";

  totalFavourites.textContent = favourites.length;
}

// STATUS MESSAGES
function showStatus(message, type = "info") {
  countriesContainer.replaceChildren();

  const status = makeElement(
    "p",
    `status-message status-${type}`,
    message
  );

  countriesContainer.appendChild(status);
}

// FETCH COUNTRIES
async function fetchCountries() {
  if (isLoading) return;

  isLoading = true;
  refreshBtn.disabled = true;
  refreshBtn.textContent = "↻ Refreshing...";

  showStatus("Loading countries...", "loading");
  resultsCount.textContent = "Loading destinations...";

  try {
    const response = await fetch(API_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid country data received.");
    }

    allCountries = data
      .filter((country) => country.name?.common && country.cca3)
      .sort((a, b) =>
        a.name.common.localeCompare(b.name.common)
      );

    updateStatistics();
    applyFilters();

  } catch (error) {
    console.error("Country API error:", error);

    showStatus(
      "Unable to load countries. Please check your connection and try again.",
      "error"
    );

    resultsCount.textContent = "Unable to load destinations";
  } finally {
    isLoading = false;
    refreshBtn.disabled = false;
    refreshBtn.textContent = "↻ Refresh";
  }
}

// CREATE COUNTRY CARDS
function displayCountries(countries) {
  countriesContainer.replaceChildren();

  resultsCount.textContent =
    `${formatNumber(countries.length)} ${
      countries.length === 1 ? "country" : "countries"
    } found`;

  if (countries.length === 0) {
    showStatus(
      currentView === "favourites"
        ? "No favourite countries match your filters. Add countries to your favourites to see them here."
        : "No countries found. Try a different search or region.",
      "empty"
    );
    return;
  }

  const fragment = document.createDocumentFragment();

  countries.forEach((country) => {
    const card = makeElement("article", "country-card");

    const flag = document.createElement("img");
    flag.src = getFlag(country);
    flag.alt = `Flag of ${country.name.common}`;
    flag.loading = "lazy";

    const content = makeElement("div", "country-card-content");

    const name = makeElement(
      "h3",
      "",
      country.name.common
    );

    const capital = makeElement(
      "p",
      "",
      `Capital: ${formatList(country.capital)}`
    );

    const population = makeElement(
      "p",
      "",
      `Population: ${formatNumber(country.population)}`
    );

    const region = makeElement(
      "p",
      "",
      `Region: ${country.region || "N/A"}`
    );

    const detailsButton = makeElement(
      "button",
      "details-btn",
      "🌍 View Details"
    );

    detailsButton.type = "button";
    detailsButton.dataset.country = country.cca3;

    const isFavourite = favourites.includes(country.cca3);

    const favouriteButton = makeElement(
      "button",
      "favourite-btn",
      isFavourite
        ? "♥ Remove Favourite"
        : "♡ Add to Favourites"
    );

    favouriteButton.type = "button";
    favouriteButton.dataset.country = country.cca3;
    favouriteButton.setAttribute(
      "aria-pressed",
      String(isFavourite)
    );

    content.append(
      name,
      capital,
      population,
      region,
      detailsButton,
      favouriteButton
    );

    card.append(flag, content);
    fragment.appendChild(card);
  });

  countriesContainer.appendChild(fragment);
}

// SEARCH, FILTER AND SORT
function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedRegion = regionFilter.value;
  const sortBy = sortSelect.value;

  const filteredCountries = allCountries.filter((country) => {
    const matchesSearch =
      country.name.common.toLowerCase().includes(searchTerm) ||
      (country.name.official || "")
        .toLowerCase()
        .includes(searchTerm);

    const matchesRegion =
      !selectedRegion ||
      country.region === selectedRegion;

    const matchesFavourites =
      currentView !== "favourites" ||
      favourites.includes(country.cca3);

    return matchesSearch && matchesRegion && matchesFavourites;
  });

  const sorters = {
    "population-desc": (a, b) =>
      (b.population ?? 0) - (a.population ?? 0),

    "population-asc": (a, b) =>
      (a.population ?? 0) - (b.population ?? 0),

    "area-desc": (a, b) =>
      (b.area ?? 0) - (a.area ?? 0),

    "area-asc": (a, b) =>
      (a.area ?? 0) - (b.area ?? 0)
  };

  filteredCountries.sort(
    sorters[sortBy] ||
    ((a, b) => a.name.common.localeCompare(b.name.common))
  );

  displayCountries(filteredCountries);
}

// VIEW NAVIGATION
function setActiveView(view) {
  currentView = view;

  allCountriesBtn.classList.toggle("active", view === "all");
  favouritesBtn.classList.toggle("active", view === "favourites");
  compareViewBtn.classList.toggle("active", view === "compare");

  countriesSection.hidden = view === "compare";
  compareSection.hidden = view !== "compare";
  countryDetails.hidden = true;

  if (view === "compare") {
    populateCompareDropdowns();
    compareResults.replaceChildren();
    scrollToSection(compareSection);
  } else {
    applyFilters();
    scrollToSection(countriesSection);
  }
}

// COUNTRY PROFILE INFO CARD
function createInfoCard(label, value) {
  const card = makeElement("div", "country-info-card");

  const labelElement = makeElement(
    "span",
    "country-info-label",
    label
  );

  const valueElement = makeElement(
    "div",
    "country-info-value",
    String(value || "N/A")
  );

  card.append(labelElement, valueElement);

  return card;
}

// COUNTRY PROFILE SECTION
function createProfileSection(title) {
  const section = makeElement(
    "section",
    "country-profile-section"
  );

  const heading = makeElement("h4", "", title);
  section.appendChild(heading);

  return section;
}

// MAP LINK
function createMapLink(text, url) {
  const link = makeElement("a", "map-link", text);

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  return link;
}

// COUNTRY DETAILS
function showCountryDetails(countryCode) {
  const country = allCountries.find(
    (item) => item.cca3 === countryCode
  );

  if (!country) return;

  detailsContainer.replaceChildren();

  // Profile header
  const profileHeader = makeElement(
    "div",
    "country-profile-header"
  );

  const flag = document.createElement("img");
  flag.src = getFlag(country);
  flag.alt = `Flag of ${country.name.common}`;
  flag.className = "details-flag";

  const nameWrapper = makeElement(
    "div",
    "country-profile-name"
  );

  const name = makeElement(
    "h3",
    "",
    country.name.common
  );

  const officialName = makeElement(
    "p",
    "country-official-name",
    country.name.official || country.name.common
  );

  nameWrapper.append(name, officialName);
  profileHeader.append(flag, nameWrapper);

  // Main facts
  const infoGrid = makeElement("div", "country-info-grid");

  const facts = [
    ["🏛️ Capital", formatList(country.capital)],
    ["👥 Population", formatNumber(country.population)],
    ["🌍 Region", country.region || "N/A"],
    ["🧭 Subregion", country.subregion || "N/A"],
    ["📐 Area", country.area != null
      ? `${formatNumber(country.area)} km²`
      : "N/A"],
    ["💰 Currencies", formatList(getCurrencyNames(country))],
    ["🗣️ Languages", formatList(getLanguages(country))],
    ["🕒 Time Zones", formatList(country.timezones)],
    ["☎️ Calling Code", getCallingCode(country)],
    ["🚗 Driving Side", country.car?.side
      ? country.car.side.charAt(0).toUpperCase() +
        country.car.side.slice(1)
      : "N/A"],
    ["🌐 Internet Domain", formatList(country.tld)],
    ["🏝️ Landlocked", typeof country.landlocked === "boolean"
      ? country.landlocked ? "Yes" : "No"
      : "N/A"],
    ["🏳️ Independent", typeof country.independent === "boolean"
      ? country.independent ? "Yes" : "No"
      : "N/A"],
    ["🇺🇳 UN Member", typeof country.unMember === "boolean"
      ? country.unMember ? "Yes" : "No"
      : "N/A"],
    ["🌎 Continents", formatList(country.continents)]
  ];

  facts.forEach(([label, value]) => {
    infoGrid.appendChild(createInfoCard(label, value));
  });

  // Neighbouring countries
  const bordersSection = createProfileSection(
    "🧭 Neighbouring Countries"
  );

  const bordersContainer = makeElement(
    "div",
    "borders-container"
  );

  if (!country.borders?.length) {
    bordersContainer.appendChild(
      makeElement("p", "", "No land borders.")
    );
  } else {
    country.borders.forEach((borderCode) => {
      const neighbour = allCountries.find(
        (item) => item.cca3 === borderCode
      );

      const button = makeElement(
        "button",
        "border-btn",
        neighbour?.name.common || borderCode
      );

      button.type = "button";
      button.dataset.country = borderCode;
      button.disabled = !neighbour;

      bordersContainer.appendChild(button);
    });
  }

  bordersSection.appendChild(bordersContainer);

  // Maps
  const mapsSection = createProfileSection(
    "📍 Explore on Maps"
  );

  const mapLinks = makeElement(
    "div",
    "country-map-links"
  );

  const googleMapsUrl =
    country.maps?.googleMaps ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(country.name.common)}`;

  mapLinks.appendChild(
    createMapLink("📍 Google Maps ↗", googleMapsUrl)
  );

  if (country.maps?.openStreetMaps) {
    mapLinks.appendChild(
      createMapLink(
        "🗺️ OpenStreetMap ↗",
        country.maps.openStreetMaps
      )
    );
  }

  mapsSection.appendChild(mapLinks);

  detailsContainer.append(
    profileHeader,
    infoGrid,
    bordersSection,
    mapsSection
  );

  countriesSection.hidden = true;
  compareSection.hidden = true;
  countryDetails.hidden = false;

  scrollToSection(countryDetails);
}

// COMPARE DROPDOWNS
function populateCompareDropdowns() {
  compareCountry1.replaceChildren();
  compareCountry2.replaceChildren();

  compareCountry1.add(new Option("Select first country", ""));
  compareCountry2.add(new Option("Select second country", ""));

  const favouriteCountries = allCountries.filter(
    (country) => favourites.includes(country.cca3)
  );

  favouriteCountries.forEach((country) => {
    compareCountry1.add(
      new Option(country.name.common, country.cca3)
    );

    compareCountry2.add(
      new Option(country.name.common, country.cca3)
    );
  });

  if (favouriteCountries.length < 2) {
    compareResults.textContent =
      "Add at least two countries to My Favourites to compare them.";
  }
}

// COMPARISON DETAIL ROW
function createDetailText(label, value) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");

  strong.textContent = `${label}: `;

  paragraph.append(
    strong,
    document.createTextNode(String(value || "N/A"))
  );

  return paragraph;
}

// COMPARISON CARD
function createComparisonCard(country) {
  const card = makeElement("article", "comparison-card");

  const name = makeElement(
    "h3",
    "",
    country.name.common
  );

  const flag = document.createElement("img");
  flag.src = getFlag(country);
  flag.alt = `Flag of ${country.name.common}`;
  flag.className = "comparison-flag";

  const facts = [
    ["Official Name", country.name.official || "N/A"],
    ["Capital", formatList(country.capital)],
    ["Population", formatNumber(country.population)],
    ["Region", country.region || "N/A"],
    ["Subregion", country.subregion || "N/A"],
    ["Area", country.area != null
      ? `${formatNumber(country.area)} km²`
      : "N/A"],
    ["Currencies", formatList(getCurrencyNames(country))],
    ["Languages", formatList(getLanguages(country))],
    ["Time Zones", formatList(country.timezones)],
    ["Calling Code", getCallingCode(country)],
    ["Driving Side", country.car?.side || "N/A"]
  ];

  card.append(name, flag);

  facts.forEach(([label, value]) => {
    card.appendChild(createDetailText(label, value));
  });

  return card;
}

// EVENTS
searchInput.addEventListener("input", applyFilters);
regionFilter.addEventListener("change", applyFilters);
sortSelect.addEventListener("change", applyFilters);

refreshBtn.addEventListener("click", fetchCountries);

allCountriesBtn.addEventListener("click", () => {
  setActiveView("all");
});

favouritesBtn.addEventListener("click", () => {
  setActiveView("favourites");
});

compareViewBtn.addEventListener("click", () => {
  setActiveView("compare");
});

// CARD ACTIONS
countriesContainer.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const detailsButton = event.target.closest(".details-btn");

  if (detailsButton && countriesContainer.contains(detailsButton)) {
    showCountryDetails(detailsButton.dataset.country);
    return;
  }

  const favouriteButton = event.target.closest(".favourite-btn");

  if (!favouriteButton || !countriesContainer.contains(favouriteButton)) {
    return;
  }

  const code = favouriteButton.dataset.country;

  if (favourites.includes(code)) {
    favourites = favourites.filter((item) => item !== code);
  } else {
    favourites.push(code);
  }

  saveFavourites();
  applyFilters();
});

// CLICKABLE NEIGHBOURS
detailsContainer.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest(".border-btn");

  if (button && detailsContainer.contains(button)) {
    showCountryDetails(button.dataset.country);
  }
});

// BACK FROM DETAILS
backBtn.addEventListener("click", () => {
  countryDetails.hidden = true;
  countriesSection.hidden = false;
  compareSection.hidden = true;

  scrollToSection(countriesSection);
});

// BACK FROM COMPARISON
compareBackBtn.addEventListener("click", () => {
  setActiveView("all");
});

// COMPARE TWO COUNTRIES
compareBtn.addEventListener("click", () => {
  const firstCode = compareCountry1.value;
  const secondCode = compareCountry2.value;

  compareResults.replaceChildren();

  if (!firstCode || !secondCode) {
    compareResults.textContent =
      "Please select two countries to compare.";
    return;
  }

  if (firstCode === secondCode) {
    compareResults.textContent =
      "Please select two different countries.";
    return;
  }

  const firstCountry = allCountries.find(
    (country) => country.cca3 === firstCode
  );

  const secondCountry = allCountries.find(
    (country) => country.cca3 === secondCode
  );

  if (!firstCountry || !secondCountry) {
    compareResults.textContent =
      "Country information is unavailable.";
    return;
  }

  const grid = makeElement("div", "comparison-grid");

  grid.append(
    createComparisonCard(firstCountry),
    createComparisonCard(secondCountry)
  );

  compareResults.appendChild(grid);
});

// INITIAL LOAD
updateStatistics();
fetchCountries();