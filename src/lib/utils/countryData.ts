import { Country, State, City } from "country-state-city";

const allCountries = Country.getAllCountries();
const sortedCountries = [
  ...allCountries.filter((c) => c.isoCode === "US"),
  ...allCountries.filter((c) => c.isoCode !== "US"),
];
export const countries = sortedCountries;
export const getState = State.getStatesOfCountry;
export const city = City;
