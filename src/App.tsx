import mapboxgl, { Map } from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from './assets';
import './App.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; 
const places: Place[] = [
  { city: "Albuquerque", country: "New Mexico, USA", coordinates: [-106.6511, 35.0845] }, 
  { city: "Abuja", country: "Nigeria", coordinates: [7.4898, 9.0573] }, 
  { city: "Hingham", country: "Massachusetts, USA", coordinates: [-70.8898, 42.2418] }, 
  { city: "Havana", country: "Cuba", coordinates: [-82.3830, 23.1330] }, 
  { city: 'Budapest', country: 'Hungary', coordinates: [19.0402, 47.4979] },
  { city: 'Rio de Janeiro', country: 'Brazil', coordinates: [-43.1729, -22.9068] },
  { city: 'Seoul', country: 'South Korea', coordinates: [126.9780, 37.5665] },
  { city: 'Cape Town', country: 'Republic of South Africa', coordinates: [18.4241, -33.9249] },
  { city: 'Sydney', country: 'New South Wales', coordinates: [151.2093, -33.8688] },
  { city: 'Jerusalem', country: 'Israel', coordinates: [35.2137, 31.7683] },
  { city: 'Dublin', country: 'Ireland', coordinates: [-6.2603, 53.3498] },
  { city: 'Seattle', country: 'Washington, USA', coordinates: [-122.3321, 47.6062] }, 
  { city: "Lagos", country: "Nigeria", coordinates: [3.3958, 6.4531] }, 
  { city: "Dubai", country: "United Arab Emirates", coordinates: [55.3047, 25.2582] }, 
  { city: 'Tokyo', country: 'Japan', coordinates: [139.6503, 35.6762] },
  { city: 'Buenos Aires', country: 'Argentina', coordinates: [-58.3816, -34.6037] },
  { city: 'Barcelona', country: 'Spain', coordinates: [2.1734, 41.3851] },
  { city: 'Vancouver', country: 'Canada', coordinates: [-123.1207, 49.2827] },
  { city: 'Los Angeles', country: 'California, USA', coordinates: [-118.2437, 34.0522] }, 
  { city: 'Berlin', country: 'Germany', coordinates: [144.9631, -37.8136] }
]

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null); 
  const map = useRef<Map | null>(null); 
  const [long, setLong] = useState<number | string>(places[0].coordinates![0]); 
  const [lat, setLat] = useState<number | string>(places[0].coordinates![1]); 
  const [zoom, setZoom] = useState<number | string>(2);
  const [searchPhrase, setSearchPhrase] = useState<string>('');

  useEffect(() => {
    if (map.current) return; 
    map.current = new mapboxgl.Map({
      container: mapContainer.current || '', 
      style: 'mapbox://styles/mapbox/streets-v12', 
      center: [long as number, lat as number], 
      zoom: zoom as number
    })
  });

  useEffect(() => {
    if (!map.current) return; 
    map.current.on('load', () => {
      map.current?.addSource('places', {
        type: 'geojson', 
        data: {
          type: 'FeatureCollection', 
          features: places.map(({ city, country, coordinates }) => {
            return {
              type: 'Feature', 
              geometry: {
                type: 'Point', 
                coordinates: coordinates!
              }, 
              properties: {
                title: city + ', ' + country
              }
            }
          })
        }
      });
      for (const place of places) {
        const el = document.createElement('div'); 
        el.className = 'marker'; 
        new mapboxgl.Marker(el, { offset: [0, -23] })
          .setLngLat(place.coordinates!)
          .addTo(map.current!); 
        el.addEventListener('click', e => {
          goTo(place); 
          openWeatherForecast(place); 
        })

      }
    }); 
    map.current.on('move', () => {
      setLong(map.current?.getCenter().lng.toFixed(4)!);
      setLat(map.current?.getCenter().lat.toFixed(4)!); 
      setZoom(map.current?.getZoom().toFixed(4)!); 
    })
  });

  const goTo = (place: Place) => {
    map.current?.flyTo({
      center: place.coordinates, 
      zoom: 6
    }); 
  }

  const openWeatherForecast = (place: Place) => {
    const popups = document.getElementsByClassName('mapboxgl-popup'); 
    if (popups[0]) popups[0].remove(); 

    const popup = weatherForecastPopup(place); 
    new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(place.coordinates!)
      .setDOMContent(popup)
      .addTo(map.current!)
      .addClassName('w-60');
  }; 

  const weatherForecastPopup = ({ city, country }: Place): Node => {
    city = city.toLowerCase().split(', ').join('-').split(' ').join('-');
    country = country.toLowerCase().split(', ').join('-').split(' ').join('-');
  
    const element = document.createElement('embed');
    element.setAttribute('itemProp', 'image'); 
    element.setAttribute('src', `https://www.meteobox.com/api-svg/${country}/${city[0]}/${city}-com.svg?refresh=1h`); 
    element.setAttribute('type', 'image/svg+xml');
    
    return element;
  }

  return (
    <div className='flex flex-col min-[680px]:flex-row gap-10 my-8 min-[680px]:my-20 lg:w-[1000px] mx-auto'>
      <div className='flex-[2] h-full'>
        <div className='mx-2'>
          <h1 className='text-2xl font-bold mb-4'>Map with Weather</h1>
          <label className='border-gray-200 border rounded-lg w-fit pr-2 py-1 shadow-md block'>
            <span className='px-2'><SearchIcon className='inline w-5 h-5' /></span>
            <input type="search" className='focus:outline-none text-sm' value={searchPhrase} onChange={e => setSearchPhrase(e.target.value)} />
          </label>
        </div>
        <ul className='my-5 h-96 overflow-auto'>
          {places
          .filter(({ city, country }) => city.toLowerCase().includes(searchPhrase) || country.toLowerCase().includes(searchPhrase))
          .map(place => (
            <li key={place.city + ', ' + place.country}>
              <a href="#" className="block p-3 hover:text-gray-700 hover:bg-gray-100 border-y" onClick={() => goTo(place)}>
                {place.city}, {place.country}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className='flex-[3] mx-2'><div ref={mapContainer} className="h-[500px] w-full rounded-lg"></div></div>
    </div>
  )
}

type Place = {
  city: string; 
  country: string; 
  coordinates?: [number, number];  
}