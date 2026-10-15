import { useEffect, useMemo, useRef, useState } from "react";
import type { City, Country, State } from "../types/types";
import "../styles/live.css";
export default function Location() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<Country[]>([]);
  const [state, setState] = useState<State[]>([]);
  const [city, setCity] = useState<City[]>([]);
  const [expandCountry, setExpandCountry] = useState<number[]>([]);
  const [expandState, setExpandState] = useState<number[]>([]);
  const [debounce, setdebounce] = useState("");
  const [countryPage, setCountrypage] = useState(1);
  const countryloader = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countryresp, stateresp, cityrespose] = await Promise.all([
          fetch("/data/countries.json"),
          fetch("/data/states.json"),
          fetch("/data/cities.json"),
        ]);
        const contresp = await countryresp.json();
        const steresp = await stateresp.json();
        const cityresp = await cityrespose.json();

        setCountry(contresp);
        setState(steresp);
        setCity(cityresp);
      } catch {
        alert("Cannot load countries and state");
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const intvl = setTimeout(() => {
      setdebounce(search);
    }, 1000);
    return () => clearTimeout(intvl);
  }, [search]);

  const searching = debounce.trim().toLowerCase();

  const statesByCountry = useMemo(() => {
    const map = new Map<number, State[]>();
    for (let i = 0; i < state.length; i++) {
      const item = state[i];
      const existingStates = map.get(item.country_id);
      if (existingStates) {
        existingStates.push(item);
      } else {
        map.set(item.country_id, [item]);
      }
    }
    return map;
  }, [state]);

  // country match
  const contMatch = useMemo(() => {
    if (!searching) {
      return null;
    }
    return country.find(
      (countries) => countries.name.toLowerCase().trim() === searching,
    );
  }, [country, searching]);

  // state match
  const statematch = useMemo(() => {
    if (!searching) {
      return [];
    }

    return state.filter((states) =>
      states.name.toLowerCase().includes(searching),
    );
  }, [state, searching]);

  // city match

  const citymatch = useMemo(() => {
    if (!searching) {
      return [];
    }
    return city.filter((cities) =>
      cities.name.toLowerCase().includes(searching),
    );
  }, [city, searching]);
  // helps of country search
  const searchCountry = useMemo(() => {
    if (!searching) {
      return country;
    }

    const stateIdmatchcountry = new Set<number>();
    const cityIdmatchcountries = new Set<number>();

    for (let i = 0; i < state.length; i++) {
      if (state[i].name.toLowerCase().includes(searching)) {
        stateIdmatchcountry.add(state[i].country_id);
      }
    }

    for (let i = 0; i < city.length; i++) {
      if (city[i].name.toLowerCase().includes(searching)) {
        cityIdmatchcountries.add(city[i].country_id);
      }
    }

    return country.filter((countries) => {
      const countrySearch = countries.name.toLowerCase().includes(searching);

      return (
        countrySearch ||
        stateIdmatchcountry.has(countries.id) ||
        cityIdmatchcountries.has(countries.id)
      );
    });
  }, [country, state, city, searching]);

  // hireachy display

  useEffect(() => {
    const contId = new Set<number>();
    const stateId = new Set<number>();
    if (!searching) {
      setExpandCountry([]);
      setExpandState([]);
      return;
    }

    if (contMatch) {
      contId.add(contMatch.id);

      const countryStates = statesByCountry.get(contMatch.id);
      if (!countryStates) {
        return;
      }
      countryStates.forEach((states) => {
        stateId.add(states.id);
      });
    }

    statematch.forEach((states) => {
      contId.add(states.country_id);
      stateId.add(states.id);
    });

    citymatch.forEach((cities) => {
      contId.add(cities.country_id);
      stateId.add(cities.state_id);
    });

    setExpandCountry([...contId]);
    setExpandState([...stateId]);
  }, [searching, contMatch, statematch, citymatch, statesByCountry]);

  // infinite scrolling

  const visiblecont = useMemo(() => {
    return searchCountry.slice(0, countryPage * 20);
  }, [searchCountry, countryPage]);

  useEffect(() => {
    setCountrypage(1);
  }, [debounce]);

  // use intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visiblecont.length < searchCountry.length) {
          setCountrypage((pre) => pre + 1);
        }
      },
      { threshold: 0.1 },
    );

    const loader = countryloader.current;
    if (loader) {
      observer.observe(loader);
    }
    return () => {
      observer.disconnect();
    };
  }, [searchCountry.length, visiblecont.length]);

  // cont toggle
  function toggleupanddowncountry(id: number) {
    setExpandCountry((prev) => {
      if (prev.includes(id)) {
        return prev.filter((countryId) => countryId !== id);
      }
      return [...prev, id];
    });

    setExpandState([]);
  }
  // state toggle
  function toggleupanddownstate(id: number) {
    setExpandState((pre) => {
      if (pre.includes(id)) {
        return pre.filter((states) => states !== id);
      }
      return [...pre, id];
    });
  }

  // city filter
  const filtercity = (stateId: number) => {
    const stateCities = citiesByState.get(stateId) ?? [];

    if (!searching) {
      return stateCities;
    }

    const currentState = state.find((states) => states.id === stateId);

    const exactStateMatch =
      currentState?.name.toLowerCase().trim() === searching;

    if (exactStateMatch) {
      return stateCities;
    }

    if (contMatch) {
      const countryOfState = currentState?.country_id;

      if (countryOfState === contMatch.id) {
        return stateCities;
      }
    }

    return stateCities.filter((cities) =>
      cities.name.toLowerCase().includes(searching),
    );
  };

  const citiesByState = useMemo(() => {
    const map = new Map<number, City[]>();

    for (let i = 0; i < city.length; i++) {
      const item = city[i];
      const existingCities = map.get(item.state_id);

      if (existingCities) {
        existingCities.push(item);
      } else {
        map.set(item.state_id, [item]);
      }
    }

    return map;
  }, [city]);

  // state filter

  const statefilter = (contId: number) => {
    const countryStates = statesByCountry.get(contId) ?? [];

    return countryStates.filter((states) => {
      if (!searching) {
        return true;
      }

      if (contMatch?.id === contId) {
        return true;
      }

      const stateMatch = states.name.toLowerCase().includes(searching);
      const stateCities = citiesByState.get(states.id) ?? [];
      const cityMatch = stateCities.some((cities) =>
        cities.name.toLowerCase().includes(searching),
      );

      return stateMatch || cityMatch;
    });
  };

  return (
    <>
      <div className="outerContainer">
        <h3>Search Your Location</h3>

        <input
          className="search"
          type="text"
          placeholder="Search location...."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search ? <p id="searching">Searching location: {search}</p> : null}

        {visiblecont.map((coun) => {
          const filteredStates = statefilter(coun.id);
          return (
            <div key={coun.id} className="countryname">
              <h4>
                {coun.emoji}
                {coun.name}

                <button
                  onClick={() => {
                    toggleupanddowncountry(coun.id);
                  }}
                >
                  {expandCountry.includes(coun.id) ? "-" : "+"}
                </button>
              </h4>

              {expandCountry.includes(coun.id) && (
                <div>
                  {filteredStates.map((states) => {
                    const filteredCities = filtercity(states.id);
                    return (
                      <div key={states.id} className="statename">
                        <p>
                          {states.name}
                          <button
                            onClick={() => {
                              toggleupanddownstate(states.id);
                            }}
                          >
                            {expandState.includes(states.id) ? "-" : "+"}
                          </button>
                        </p>
                        {expandState.includes(states.id) && (
                          <div className="cityname">
                            {filteredCities.map((cities) => (
                              <p key={cities.id}>{cities.name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {visiblecont.length < searchCountry.length && (
          <div ref={countryloader}></div>
        )}
      </div>
    </>
  );
}
