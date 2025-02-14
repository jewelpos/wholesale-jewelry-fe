import { Country, State, City } from "country-state-city";

export const countries = Country.getAllCountries();
export const getState = State.getStatesOfCountry;
export const city = City;
