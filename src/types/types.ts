export interface Country {
  id: number;
  name: string;
  emoji: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
  country_name: string;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
  state_name: string;
  country_id: number;
  country_name: string;
  latitude?: string;
  longitude?: string;
  wikiDataId?: string;
}
