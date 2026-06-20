import { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  CloudDrizzle,
  Star,
  Eye,
  Compass,
  Sunrise,
  Sunset,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  Info,
  Navigation,
  Activity
} from 'lucide-react';
import WeatherParticles from './components/WeatherParticles';
import WeatherRadar from './components/WeatherRadar';
import './App.css';

// Curated high-resolution weather backgrounds
const WEATHER_BACKGROUNDS = {
  clearDay: 'https://images.unsplash.com/photo-1601297183305-6dfc4270492e?auto=format&fit=crop&w=1920&q=80',
  clearNight: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80',
  cloudyDay: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80',
  cloudyNight: 'https://images.unsplash.com/photo-1532960401447-7dd05bef20b0?auto=format&fit=crop&w=1920&q=80',
  rainy: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1920&q=80',
  snowy: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=80',
  thunderstorm: 'https://images.unsplash.com/photo-1472145246862-b24cf2e24fe8?auto=format&fit=crop&w=1920&q=80',
  foggy: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1920&q=80',
};

// Preset high-resolution desktop wallpapers
const PRESET_WALLPAPERS = {
  clearDay: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  rainy: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
  snowy: 'https://images.unsplash.com/photo-1485594050903-8e8ee7b071a8?auto=format&fit=crop&w=1920&q=80',
  thunderstorm: 'https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?auto=format&fit=crop&w=1920&q=80',
  starry: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1920&q=80',
};

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isCelsius, setIsCelsius] = useState(true);
  const [bgType, setBgType] = useState('city'); // 'city' or 'weather'
  const [cityImage, setCityImage] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('temp'); // 'temp', 'precip'
  
  // Custom Background States
  const [bgSource, setBgSource] = useState('dynamic'); // 'dynamic', 'preset', 'custom'
  const [activePreset, setActivePreset] = useState('clearDay');
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [bgBlur, setBgBlur] = useState(3); // default 3px blur
  const [bgDarkness, setBgDarkness] = useState(45); // default 45% darkness
  const [showBgSettings, setShowBgSettings] = useState(false);

  const searchInputRef = useRef(null);

  // Load favorites and default city on mount
  useEffect(() => {
    const saved = localStorage.getItem('skycast_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
    // Default city: London
    fetchWeather(51.5074, -0.1278, 'London');
  }, []);

  // Fetch City Image from Teleport API
  const fetchCityImage = async (cityName) => {
    try {
      const searchResp = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(cityName)}`);
      const searchData = await searchResp.json();
      const cityResults = searchData._embedded?.['city:search-results'];
      if (!cityResults || cityResults.length === 0) return null;

      const cityUrl = cityResults[0]._links['city:item'].href;
      const cityResp = await fetch(cityUrl);
      const cityData = await cityResp.json();

      const uaUrl = cityData._links?.['city:urban_area']?.href;
      if (!uaUrl) return null;

      const uaResp = await fetch(uaUrl);
      const uaData = await uaResp.json();
      const imagesUrl = uaData._links?.['ua:images']?.href;
      if (!imagesUrl) return null;

      const imgResp = await fetch(imagesUrl);
      const imgData = await imgResp.json();
      const photo = imgData.photos?.[0]?.image?.web;
      return photo || null;
    } catch (err) {
      console.warn('Teleport city image not available for:', cityName);
      return null;
    }
  };

  // Fetch Air Quality from Open-Meteo
  const fetchAirQuality = async (lat, lon) => {
    try {
      const resp = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi&timezone=auto`);
      const data = await resp.json();
      return {
        pm25: Math.round(data.current.pm2_5),
        pm10: Math.round(data.current.pm10),
        aqi: data.current.us_aqi,
      };
    } catch (err) {
      console.error('Air quality fetch error:', err);
      return null;
    }
  };

  // Fetch Weather Details
  const fetchWeather = async (lat, lon, cityName) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedIndex(-1);
    setCity('');
    try {
      const weatherResp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,precipitation,uv_index,visibility,pressure_msl&hourly=temperature_2m,weather_code,is_day,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`
      );
      if (!weatherResp.ok) throw new Error('Weather data failed');
      const weatherData = await weatherResp.json();

      const aqiData = await fetchAirQuality(lat, lon);
      const cityImgUrl = await fetchCityImage(cityName);
      setCityImage(cityImgUrl);

      // Find the current hour index in the hourly data
      const nowIso = new Date().toISOString().substring(0, 13) + ':00';
      let startIndex = weatherData.hourly.time.findIndex((t) => t.startsWith(nowIso.substring(0, 13)));
      if (startIndex === -1) {
        startIndex = new Date().getHours();
      }

      // Slice 24 hours of forecast
      const hourlyForecast = [];
      for (let i = startIndex; i < startIndex + 24; i++) {
        if (weatherData.hourly.time[i]) {
          hourlyForecast.push({
            time: weatherData.hourly.time[i],
            temp: Math.round(weatherData.hourly.temperature_2m[i]),
            weatherCode: weatherData.hourly.weather_code[i],
            isDay: weatherData.hourly.is_day[i],
            precipProb: weatherData.hourly.precipitation_probability[i] || 0,
          });
        }
      }

      setWeather({
        cityName,
        lat,
        lon,
        temp: Math.round(weatherData.current.temperature_2m),
        feelsLike: Math.round(weatherData.current.apparent_temperature),
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        windDirection: weatherData.current.wind_direction_10m,
        precipitation: weatherData.current.precipitation,
        uvIndex: Math.round(weatherData.current.uv_index),
        visibility: (weatherData.current.visibility / 1000).toFixed(1), // in km
        pressure: Math.round(weatherData.current.pressure_msl),
        weatherCode: weatherData.current.weather_code,
        isDay: weatherData.current.is_day,
        aqi: aqiData,
        hourly: hourlyForecast,
        daily: weatherData.daily.time.map((time, i) => ({
          date: time,
          weatherCode: weatherData.daily.weather_code[i],
          maxTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
          minTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
          sunrise: weatherData.daily.sunrise[i],
          sunset: weatherData.daily.sunset[i],
          uvMax: Math.round(weatherData.daily.uv_index_max[i]),
        })),
      });
    } catch (err) {
      setError('Failed to fetch weather data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search city suggestions
  useEffect(() => {
    if (city.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
        );
        const data = await resp.json();
        setSuggestions(data.results || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [city]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex];
        fetchWeather(selected.latitude, selected.longitude, selected.name);
      } else {
        const selected = suggestions[0];
        fetchWeather(selected.latitude, selected.longitude, selected.name);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const searchSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      const selected = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
      fetchWeather(selected.latitude, selected.longitude, selected.name);
    }
  };

  // Favorites logic
  const isFavorited = weather && favorites.some((fav) => fav.cityName === weather.cityName);

  const toggleFavorite = () => {
    if (!weather) return;
    let updated;
    if (isFavorited) {
      updated = favorites.filter((fav) => fav.cityName !== weather.cityName);
    } else {
      updated = [...favorites, { cityName: weather.cityName, lat: weather.lat, lon: weather.lon }];
    }
    setFavorites(updated);
    localStorage.setItem('skycast_favorites', JSON.stringify(updated));
  };

  // Convert temp C to F
  const convertTemp = (tempC) => {
    if (isCelsius) return tempC;
    return Math.round((tempC * 9) / 5 + 32);
  };

  const getAQIDescription = (aqi) => {
    if (aqi <= 50) return { label: 'Good', color: '#10b981', desc: 'Air is clean and healthy.' };
    if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b', desc: 'Acceptable air quality.' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#f97316', desc: 'Sensitive groups may experience health effects.' };
    return { label: 'Unhealthy', color: '#ef4444', desc: 'Everyone may begin to experience health effects.' };
  };

  const getWeatherIcon = (code, isDaytime = 1, size = 64) => {
    if (code === 0) {
      return isDaytime ? <Sun size={size} className="text-sun" /> : <Moon size={size} className="text-moon" />;
    }
    if (code >= 1 && code <= 3) return <Cloud size={size} className="text-cloud" />;
    if (code >= 45 && code <= 48) return <Cloud size={size} className="text-fog" />;
    if (code >= 51 && code <= 57) return <CloudDrizzle size={size} className="text-rain" />;
    if (code >= 61 && code <= 67) return <CloudRain size={size} className="text-rain" />;
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-snow" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-rain-showers" />;
    if (code >= 85 && code <= 86) return <CloudSnow size={size} className="text-snow" />;
    if (code >= 95 && code <= 99) return <CloudLightning size={size} className="text-thunder" />;
    return <Cloud size={size} />;
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45) return 'Foggy';
    if (code === 48) return 'Depositing Rime Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rainy';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 75) return 'Snowing';
    if (code === 77) return 'Snow Grains';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Cloudy';
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return { label: 'Low', color: '#10b981' };
    if (uv <= 5) return { label: 'Mod', color: '#f59e0b' };
    if (uv <= 7) return { label: 'High', color: '#f97316' };
    return { label: 'Very High', color: '#ef4444' };
  };

  const getActiveBg = () => {
    if (bgSource === 'custom' && customBgUrl) {
      return customBgUrl;
    }
    if (bgSource === 'preset') {
      return PRESET_WALLPAPERS[activePreset] || WEATHER_BACKGROUNDS.clearDay;
    }
    // Dynamic background
    if (bgType === 'city' && cityImage) {
      return cityImage;
    }
    if (!weather) return WEATHER_BACKGROUNDS.clearDay;
    const code = weather.weatherCode;
    const isDay = weather.isDay;
    if (code === 0) return isDay ? WEATHER_BACKGROUNDS.clearDay : WEATHER_BACKGROUNDS.clearNight;
    if (code >= 1 && code <= 3) return isDay ? WEATHER_BACKGROUNDS.cloudyDay : WEATHER_BACKGROUNDS.cloudyNight;
    if (code >= 45 && code <= 48) return WEATHER_BACKGROUNDS.foggy;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return WEATHER_BACKGROUNDS.rainy;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return WEATHER_BACKGROUNDS.snowy;
    if (code >= 95 && code <= 99) return WEATHER_BACKGROUNDS.thunderstorm;
    return isDay ? WEATHER_BACKGROUNDS.clearDay : WEATHER_BACKGROUNDS.clearNight;
  };

  const getSunPath = () => {
    if (!weather || !weather.daily[0]) return { x: 50, y: 80, percent: 0, isDaytime: true };
    const sunriseStr = weather.daily[0].sunrise;
    const sunsetStr = weather.daily[0].sunset;
    const now = new Date();
    const sunrise = new Date(sunriseStr);
    const sunset = new Date(sunsetStr);

    const nowMs = now.getTime();
    const sunriseMs = sunrise.getTime();
    const sunsetMs = sunset.getTime();

    if (nowMs < sunriseMs || nowMs > sunsetMs) {
      return { percent: 0, isDaytime: false };
    }

    const totalDaylight = sunsetMs - sunriseMs;
    const currentProgress = nowMs - sunriseMs;
    const percent = Math.min(1, Math.max(0, currentProgress / totalDaylight));

    const x = 10 + 80 * percent;
    const y = 80 - 60 * Math.sin(percent * Math.PI);
    return { x, y, percent, isDaytime: true };
  };

  const sunPath = getSunPath();

  // Generate SVG Hourly Temperature/Precipitation Curve Points
  const getHourlyChartPaths = () => {
    if (!weather || weather.hourly.length === 0) return { pathD: '', areaD: '', points: [] };

    // Get active values based on tab
    const values = weather.hourly.map(h => activeTab === 'temp' ? h.temp : h.precipProb);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const valRange = (maxVal - minVal) || 1;

    const chartHeight = 90;
    const topPadding = 15;
    const bottomPadding = 15;

    const points = weather.hourly.map((h, i) => {
      const val = activeTab === 'temp' ? h.temp : h.precipProb;
      const norm = (val - minVal) / valRange;
      const x = i * 98 + 41; // align to cards (82px width + 16px gap = 98px step, card center is 41px)
      const y = chartHeight - (norm * (chartHeight - topPadding - bottomPadding) + bottomPadding) + 15;
      return { x, y, val };
    });

    // Smooth Bezier Curve Path constructor
    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpX1 = prev.x + 49;
      const cpY1 = prev.y;
      const cpX2 = p.x - 49;
      const cpY2 = p.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`;

    return { pathD, areaD, points };
  };

  const chartData = getHourlyChartPaths();

  return (
    <>
      {/* Background visual styles & moving ambient blobs */}
      <div className="app-bg-wrapper" style={{ backgroundImage: `url(${getActiveBg()})` }} />
      <div 
        className="app-bg-overlay" 
        style={{
          backdropFilter: `blur(${bgBlur}px) saturate(120%)`,
          WebkitBackdropFilter: `blur(${bgBlur}px) saturate(120%)`,
          background: `radial-gradient(circle at 50% 20%, rgba(15, 23, 42, ${(bgDarkness / 100) * 0.75}) 0%, rgba(15, 23, 42, ${(bgDarkness / 100) * 0.98}) 100%)`
        }}
      />
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      {weather && <WeatherParticles weatherCode={weather.weatherCode} isDay={weather.isDay} />}

      <main className="app-container">
        {/* Header Section */}
        <header className="app-header glass">
          <div className="brand">
            <Sparkles className="logo-sparkle animate-pulse" size={24} />
            <h1>SkyCast</h1>
          </div>

          {/* Search bar and suggestions dropdown */}
          <div className="search-section">
            <form onSubmit={searchSubmit} className="search-form">
              <div className="input-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search city (e.g. Paris, Tokyo)..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {city && (
                  <button type="button" className="clear-btn" onClick={() => setCity('')}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((item, index) => (
                  <li
                    key={item.id}
                    className={`suggestion-item ${selectedIndex === index ? 'active' : ''}`}
                    onClick={() => fetchWeather(item.latitude, item.longitude, item.name)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <MapPin size={14} className="pin-icon" />
                    <span className="city-name">{item.name}</span>
                    {item.admin1 && <span className="admin-name">, {item.admin1}</span>}
                    <span className="country-code"> ({item.country_code})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className={`fav-toggle-btn glass ${showBgSettings ? 'active' : ''}`}
              onClick={() => {
                setShowBgSettings(!showBgSettings);
                setShowFavoritesOnly(false); // Close favorites if open
              }}
              title="Configure background image settings"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Eye size={18} />
              <span>Background</span>
            </button>

            <div className="unit-switch" onClick={() => setIsCelsius(!isCelsius)}>
              <span className={isCelsius ? 'active' : ''}>°C</span>
              <div className="slider-wrapper">
                <div className={`slider-thumb ${isCelsius ? 'c' : 'f'}`} />
              </div>
              <span className={!isCelsius ? 'active' : ''}>°F</span>
            </div>

            <button
              className={`fav-toggle-btn glass ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setShowBgSettings(false); // Close bg settings if open
              }}
            >
              <Star size={18} fill={showFavoritesOnly ? '#f59e0b' : 'none'} className="fav-star" />
              <span>Saved</span>
            </button>
          </div>
        </header>

        {/* Background Settings Customize Panel */}
        {showBgSettings && (
          <div className="bg-settings-panel glass animate-slide-down">
            <div className="panel-header">
              <h3>Background Settings</h3>
              <button className="close-panel-btn" onClick={() => setShowBgSettings(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="settings-content">
              {/* Image Source Selection */}
              <div className="setting-group">
                <span className="setting-title">Image Source</span>
                <div className="source-tabs">
                  <button 
                    className={`tab-btn ${bgSource === 'dynamic' ? 'active' : ''}`}
                    onClick={() => setBgSource('dynamic')}
                  >
                    Dynamic
                  </button>
                  <button 
                    className={`tab-btn ${bgSource === 'preset' ? 'active' : ''}`}
                    onClick={() => setBgSource('preset')}
                  >
                    Presets
                  </button>
                  <button 
                    className={`tab-btn ${bgSource === 'custom' ? 'active' : ''}`}
                    onClick={() => setBgSource('custom')}
                  >
                    Custom URL
                  </button>
                </div>
              </div>

              {/* Dynamic View Option */}
              {bgSource === 'dynamic' && (
                <div className="setting-group">
                  <span className="setting-title">Dynamic Layer Priority</span>
                  <div className="bg-toggle-switch">
                    <button
                      className={`bg-toggle-btn ${bgType === 'city' ? 'active' : ''}`}
                      onClick={() => setBgType('city')}
                      title="Show searched city photo if available"
                    >
                      City View (Teleport)
                    </button>
                    <button
                      className={`bg-toggle-btn ${bgType === 'weather' ? 'active' : ''}`}
                      onClick={() => setBgType('weather')}
                      title="Show weather animation background"
                    >
                      Weather View (Unsplash)
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Selection Grid */}
              {bgSource === 'preset' && (
                <div className="setting-group">
                  <span className="setting-title">Select Preset Wallpaper</span>
                  <div className="presets-grid">
                    <button 
                      className={`preset-thumb ${activePreset === 'clearDay' ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${PRESET_WALLPAPERS.clearDay})` }}
                      onClick={() => setActivePreset('clearDay')}
                      title="Clear Day"
                    >
                      <span>Sunny</span>
                    </button>
                    <button 
                      className={`preset-thumb ${activePreset === 'rainy' ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${PRESET_WALLPAPERS.rainy})` }}
                      onClick={() => setActivePreset('rainy')}
                      title="Rainy Window"
                    >
                      <span>Rainy</span>
                    </button>
                    <button 
                      className={`preset-thumb ${activePreset === 'snowy' ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${PRESET_WALLPAPERS.snowy})` }}
                      onClick={() => setActivePreset('snowy')}
                      title="Snow Forest"
                    >
                      <span>Snowy</span>
                    </button>
                    <button 
                      className={`preset-thumb ${activePreset === 'thunderstorm' ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${PRESET_WALLPAPERS.thunderstorm})` }}
                      onClick={() => setActivePreset('thunderstorm')}
                      title="Thunderstorm"
                    >
                      <span>Storm</span>
                    </button>
                    <button 
                      className={`preset-thumb ${activePreset === 'starry' ? 'active' : ''}`}
                      style={{ backgroundImage: `url(${PRESET_WALLPAPERS.starry})` }}
                      onClick={() => setActivePreset('starry')}
                      title="Nebula Cosmos"
                    >
                      <span>Cosmos</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Image URL Input */}
              {bgSource === 'custom' && (
                <div className="setting-group">
                  <span className="setting-title">Custom Wallpaper URL</span>
                  <div className="custom-url-box">
                    <input 
                      type="text" 
                      placeholder="Paste image link (e.g. https://images.unsplash.com/...)" 
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                    />
                    <button 
                      className="apply-url-btn"
                      onClick={() => {
                        if (customBgUrl.trim()) {
                          setCustomBgUrl(customBgUrl.trim());
                        }
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Blurring and Contrast Sliders */}
              <div className="sliders-row">
                <div className="slider-control">
                  <div className="slider-label">
                    <span>Background Blur</span>
                    <span>{bgBlur}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    value={bgBlur} 
                    onChange={(e) => setBgBlur(Number(e.target.value))} 
                  />
                </div>

                <div className="slider-control">
                  <div className="slider-label">
                    <span>Overlay Darkness</span>
                    <span>{bgDarkness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={bgDarkness} 
                    onChange={(e) => setBgDarkness(Number(e.target.value))} 
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Saved/Favorites Cities Sidebar/Panel */}
        {showFavoritesOnly && (
          <div className="favorites-panel glass animate-slide-down">
            <div className="fav-panel-header">
              <h3>Saved Locations</h3>
              <button className="close-panel-btn" onClick={() => setShowFavoritesOnly(false)}>
                <X size={18} />
              </button>
            </div>
            {favorites.length === 0 ? (
              <p className="no-favs">No saved cities. Click the star icon next to the city name to save!</p>
            ) : (
              <div className="favorites-grid">
                {favorites.map((fav) => (
                  <div
                    key={fav.cityName}
                    className="fav-card glass-hover"
                    onClick={() => {
                      fetchWeather(fav.lat, fav.lon, fav.cityName);
                      setShowFavoritesOnly(false);
                    }}
                  >
                    <div className="fav-info">
                      <MapPin size={14} className="text-secondary" />
                      <h4>{fav.cityName}</h4>
                    </div>
                    <button
                      className="delete-fav-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = favorites.filter((item) => item.cityName !== fav.cityName);
                        setFavorites(updated);
                        localStorage.setItem('skycast_favorites', JSON.stringify(updated));
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-state glass">
            <Loader2 className="spinner animate-spin" size={48} />
            <p>Loading premium weather data...</p>
          </div>
        )}

        {/* Error message */}
        {error && <div className="error-message glass">{error}</div>}

        {/* Main Content Dashboard */}
        {!loading && weather && (
          <div className="dashboard-content">
            
            {/* Grid Layout: Left (Core Weather & Stats) & Right (Insights/Visuals) */}
            <div className="main-grid">
              
              {/* Left Core Card */}
              <div className="card-left-section">
                
                {/* Current Weather Card */}
                <div className="main-card glass weather-hero">
                  {/* Weather type glowing accent */}
                  <div className={`hero-glow glow-${weather.isDay ? 'day' : 'night'}`} />
                  
                  <div className="card-header">
                    <div className="location-info">
                      <div className="location-title">
                        <MapPin size={22} className="pin-animation" />
                        <h2>{weather.cityName}</h2>
                        <button
                          className="favorite-btn"
                          onClick={toggleFavorite}
                          title={isFavorited ? 'Remove from saved' : 'Save location'}
                        >
                          <Star size={20} fill={isFavorited ? '#f59e0b' : 'none'} color={isFavorited ? '#f59e0b' : '#fff'} />
                        </button>
                      </div>
                      <p className="local-date">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    </div>
                    <button
                      className="refresh-btn"
                      onClick={() => fetchWeather(weather.lat, weather.lon, weather.cityName)}
                      title="Update Weather"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  <div className="main-info">
                    <div className="weather-large-icon">
                      {getWeatherIcon(weather.weatherCode, weather.isDay, 110)}
                    </div>
                    <div className="temp-section">
                      <span className="temp-number">{convertTemp(weather.temp)}°</span>
                      <p className="weather-desc">{getWeatherDescription(weather.weatherCode)}</p>
                    </div>
                  </div>

                  {/* Highlights Sub-Grid */}
                  <div className="details-grid">
                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Thermometer size={20} className="detail-icon text-temp" />
                      </div>
                      <div className="detail-info">
                        <span>Feels Like</span>
                        <p>{convertTemp(weather.feelsLike)}°{isCelsius ? 'C' : 'F'}</p>
                      </div>
                    </div>

                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Droplets size={20} className="detail-icon text-humidity" />
                      </div>
                      <div className="detail-info">
                        <span>Humidity</span>
                        <p>{weather.humidity}%</p>
                      </div>
                    </div>

                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Wind size={20} className="detail-icon text-wind" />
                      </div>
                      <div className="detail-info">
                        <span>Wind Speed</span>
                        <p>{weather.windSpeed} km/h</p>
                      </div>
                    </div>

                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Compass size={20} className="detail-icon text-uv" />
                      </div>
                      <div className="detail-info">
                        <span>Wind Dir</span>
                        <div className="wind-direction-box">
                          <span
                            className="wind-arrow"
                            style={{ transform: `rotate(${weather.windDirection}deg)` }}
                          >
                            ↑
                          </span>
                          <p>{weather.windDirection}°</p>
                        </div>
                      </div>
                    </div>

                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Eye size={20} className="detail-icon text-visibility" />
                      </div>
                      <div className="detail-info">
                        <span>Visibility</span>
                        <p>{weather.visibility} km</p>
                      </div>
                    </div>

                    <div className="detail-item glass-hover">
                      <div className="detail-icon-box">
                        <Info size={20} className="detail-icon text-pressure" />
                      </div>
                      <div className="detail-info">
                        <span>Pressure</span>
                        <p>{weather.pressure} hPa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Visuals (Air Quality & Radar or Sun Path) */}
              <div className="card-right-section">
                
                {/* Air Quality Card */}
                {weather.aqi && (
                  <div className="aqi-card glass">
                    <div className="card-title">
                      <h3>Air Quality Index</h3>
                    </div>
                    <div className="aqi-main">
                      <div
                        className="aqi-circle"
                        style={{ borderColor: getAQIDescription(weather.aqi.aqi).color }}
                      >
                        <span className="aqi-value">{weather.aqi.aqi}</span>
                        <span className="aqi-label" style={{ color: getAQIDescription(weather.aqi.aqi).color }}>
                          {getAQIDescription(weather.aqi.aqi).label}
                        </span>
                      </div>
                      <div className="aqi-pollutants">
                        <div className="pollutant">
                          <span>PM 2.5</span>
                          <p>{weather.aqi.pm25} µg/m³</p>
                        </div>
                        <div className="pollutant">
                          <span>PM 10</span>
                          <p>{weather.aqi.pm10} µg/m³</p>
                        </div>
                      </div>
                    </div>
                    <p className="aqi-message text-secondary">
                      {getAQIDescription(weather.aqi.aqi).desc}
                    </p>
                  </div>
                )}

                {/* Sun Path Visualizer */}
                <div className="sun-path-card glass">
                  <div className="card-title">
                    <h3>Sunrise & Sunset</h3>
                  </div>
                  <div className="sun-path-visual">
                    <svg viewBox="0 0 100 80" className="sun-svg">
                      <defs>
                        <linearGradient id="sun-path-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                      
                      {/* Sun path filled area */}
                      {sunPath.isDaytime && (
                        <path
                          d={`M 10,80 A 40,40 0 0,1 ${sunPath.x},${sunPath.y} L ${sunPath.x} 80 Z`}
                          fill="url(#sun-path-grad)"
                        />
                      )}
                      
                      <path
                        d="M 10,80 A 40,40 0 0,1 90,80"
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      
                      {sunPath.isDaytime ? (
                        <>
                          <path
                            d={`M 10,80 A 40,40 0 0,1 ${sunPath.x},${sunPath.y}`}
                            fill="none"
                            stroke="var(--accent-color)"
                            strokeWidth="2"
                          />
                          <circle cx={sunPath.x} cy={sunPath.y} r="4.5" fill="#f59e0b" className="sun-svg-orb" />
                        </>
                      ) : (
                        <circle cx="50" cy="80" r="4" fill="#94a3b8" />
                      )}
                    </svg>

                    <div className="sun-times-overlay">
                      <div className="sun-time-box">
                        <Sunrise size={18} className="text-sun" />
                        <div className="time-details">
                          <span>Sunrise</span>
                          <p>
                            {new Date(weather.daily[0].sunrise).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="sun-time-box">
                        <Sunset size={18} className="text-sunset" />
                        <div className="time-details">
                          <span>Sunset</span>
                          <p>
                            {new Date(weather.daily[0].sunset).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="sun-path-status text-secondary">
                    {sunPath.isDaytime
                      ? `Daylight progress: ${Math.round(sunPath.percent * 100)}%`
                      : 'The sun has set.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Meteorological Details Grid (Gauges Section) */}
            <div className="gauges-row">
              {/* UV Circular Gauge */}
              <div className="gauge-card glass">
                <div className="gauge-header">
                  <Sun size={16} className="text-sun" />
                  <h4>UV Index</h4>
                </div>
                <div className="gauge-content">
                  <div className="uv-gauge-svg-box">
                    <svg viewBox="0 0 100 65" className="gauge-svg">
                      <defs>
                        <linearGradient id="uv-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      {/* Background arc */}
                      <path d="M 15 55 A 35 35 0 0 1 85 55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                      {/* Active arc */}
                      <path
                        d="M 15 55 A 35 35 0 0 1 85 55"
                        fill="none"
                        stroke="url(#uv-grad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="110"
                        strokeDashoffset={110 - (Math.min(weather.uvIndex, 11) / 11) * 110}
                      />
                    </svg>
                    <div className="uv-gauge-text">
                      <span className="uv-val">{weather.uvIndex}</span>
                      <span className="uv-lbl" style={{ color: getUVLevel(weather.uvIndex).color }}>
                        {getUVLevel(weather.uvIndex).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Humidity Progress Ring */}
              <div className="gauge-card glass">
                <div className="gauge-header">
                  <Droplets size={16} className="text-humidity" />
                  <h4>Humidity</h4>
                </div>
                <div className="gauge-content">
                  <div className="humidity-ring-box">
                    <svg viewBox="0 0 80 80" className="circle-gauge-svg">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="var(--color-humidity)"
                        strokeWidth="6"
                        strokeDasharray="188.4"
                        strokeDashoffset={188.4 - (weather.humidity / 100) * 188.4}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="humidity-text">
                      <span className="humidity-val">{weather.humidity}%</span>
                      <span className="humidity-lbl text-secondary">Moisture</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wind Compass Dial */}
              <div className="gauge-card glass">
                <div className="gauge-header">
                  <Wind size={16} className="text-wind" />
                  <h4>Wind Direction</h4>
                </div>
                <div className="gauge-content">
                  <div className="compass-dial-box">
                    <div className="compass-ring">
                      <span className="cardinal n">N</span>
                      <span className="cardinal e">E</span>
                      <span className="cardinal s">S</span>
                      <span className="cardinal w">W</span>
                      <div
                        className="compass-needle"
                        style={{ transform: `rotate(${weather.windDirection}deg)` }}
                      >
                        <div className="arrow-head" />
                        <div className="arrow-shaft" />
                      </div>
                    </div>
                    <div className="compass-text">
                      <span className="wind-dir-val">{weather.windSpeed} km/h</span>
                      <span className="wind-dir-deg text-secondary">{weather.windDirection}° Deg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Doppler Radar Card */}
              <div className="gauge-card glass radar-card">
                <div className="gauge-header">
                  <Activity size={16} style={{ color: '#38bdf8' }} />
                  <h4>Live Doppler Scan</h4>
                </div>
                <div className="gauge-content radar-content">
                  <WeatherRadar />
                </div>
              </div>

            </div>

            {/* Hourly Forecast (Horizontal Scrolling Slider & Curve Chart) */}
            <div className="hourly-section glass">
              <div className="hourly-section-header">
                <h3 className="section-title">Hourly Forecast (Next 24h)</h3>
                
                {/* Tab selector for Chart */}
                <div className="chart-tabs">
                  <button
                    className={`chart-tab-btn ${activeTab === 'temp' ? 'active' : ''}`}
                    onClick={() => setActiveTab('temp')}
                  >
                    Temperature
                  </button>
                  <button
                    className={`chart-tab-btn ${activeTab === 'precip' ? 'active' : ''}`}
                    onClick={() => setActiveTab('precip')}
                  >
                    Rain Prob. (%)
                  </button>
                </div>
              </div>

              {/* Integrated Hourly Slider & continuous SVG Chart */}
              <div className="hourly-slider-container">
                <div className="hourly-slider">
                  {weather.hourly.map((item, index) => (
                    <div key={index} className="hourly-card glass-hover">
                      <p className="hour-time">
                        {index === 0
                          ? 'Now'
                          : new Date(item.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              hour12: true,
                            })}
                      </p>
                      <div className="hour-icon">
                        {getWeatherIcon(item.weatherCode, item.isDay, 28)}
                      </div>
                      <p className="hour-temp">
                        {activeTab === 'temp' ? `${convertTemp(item.temp)}°` : `${item.precipProb}%`}
                      </p>
                    </div>
                  ))}
                  
                  {/* SVG Temperature Curve overlay inside scroll container */}
                  <div className="hourly-chart-overlay">
                    <svg className="hourly-chart-svg" width={24 * 98} height={120}>
                      <defs>
                        <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop
                            offset="0%"
                            stopColor={activeTab === 'temp' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(96, 165, 250, 0.35)'}
                          />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area Fill */}
                      {chartData.areaD && (
                        <path d={chartData.areaD} fill="url(#chart-gradient)" />
                      )}
                      
                      {/* Line Path */}
                      {chartData.pathD && (
                        <path
                          d={chartData.pathD}
                          fill="none"
                          stroke={activeTab === 'temp' ? '#38bdf8' : '#60a5fa'}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.4))"
                        />
                      )}
                      
                      {/* Interactive Point circles */}
                      {chartData.points.map((pt, index) => (
                        <circle
                          key={index}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill={activeTab === 'temp' ? '#38bdf8' : '#60a5fa'}
                          stroke="rgba(15, 23, 42, 0.8)"
                          strokeWidth="2"
                        />
                      ))}
                    </svg>
                  </div>

                </div>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="forecast-section">
              <h3 className="section-title">7-Day Forecast</h3>
              <div className="forecast-grid">
                {weather.daily.map((day, index) => {
                  const dateObj = new Date(day.date);
                  const isToday = index === 0;

                  return (
                    <div key={index} className={`forecast-card glass ${isToday ? 'forecast-today' : 'glass-hover'}`}>
                      <p className="day-name">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="day-date">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      
                      <div className="forecast-icon">
                        {getWeatherIcon(day.weatherCode, 1, 36)}
                      </div>
                      
                      <p className="forecast-status">{getWeatherDescription(day.weatherCode)}</p>

                      <div className="temps">
                        <div className="temp-range">
                          <span className="min-temp">{convertTemp(day.minTemp)}°</span>
                          <div className="temp-bar-bg">
                            <div className="temp-bar-fill" />
                          </div>
                          <span className="max-temp">{convertTemp(day.maxTemp)}°</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}

export default App;
