import { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  CloudDrizzle
} from 'lucide-react'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const fetchWeather = async (lat, lon, cityName) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
      const data = await resp.json()
      setWeather({
        cityName,
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day,
        daily: data.daily.time.map((time, i) => ({
          date: time,
          weatherCode: data.daily.weather_code[i],
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
        }))
      })
    } catch (err) {
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const searchCity = async (e) => {
    e.preventDefault()
    if (!city) return
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`)
      const data = await resp.json()
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        fetchWeather(result.latitude, result.longitude, result.name)
      } else {
        setError('City not found')
      }
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Default city: London
    fetchWeather(51.5074, -0.1278, 'London')
  }, [])

  const getWeatherIcon = (code, size = 64) => {
    // WMO Weather interpretation codes
    if (code === 0) return <Sun size={size} className="text-yellow-400" />
    if (code >= 1 && code <= 3) return <Cloud size={size} className="text-gray-300" />
    if (code >= 45 && code <= 48) return <Cloud size={size} className="text-gray-400" />
    if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-blue-400" />
    if (code >= 71 && code <= 77) return <CloudSnow size={size} className="text-white" />
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-500" />
    if (code >= 95 && code <= 99) return <CloudLightning size={size} className="text-purple-400" />
    return <Cloud size={size} />
  }

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear Sky'
    if (code === 1) return 'Mainly Clear'
    if (code === 2) return 'Partly Cloudy'
    if (code === 3) return 'Overcast'
    if (code >= 51 && code <= 55) return 'Drizzle'
    if (code >= 61 && code <= 65) return 'Rain'
    if (code >= 71 && code <= 75) return 'Snow'
    if (code >= 80 && code <= 82) return 'Rain Showers'
    if (code >= 95) return 'Thunderstorm'
    return 'Cloudy'
  }

  return (
    <main className="app-container">
      <div className="search-bar">
        <form onSubmit={searchCity}>
          <div className="input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {weather && (
        <div className="weather-content">
          <div className="main-card glass">
            <div className="card-header">
              <div className="location">
                <MapPin size={24} />
                <h2>{weather.cityName}</h2>
              </div>
              <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div className="main-info">
              <div className="temp-section">
                <div className="icon">
                  {getWeatherIcon(weather.weatherCode, 100)}
                </div>
                <div className="temp-value">
                  <h1>{weather.temp}°</h1>
                  <p>{getWeatherDescription(weather.weatherCode)}</p>
                </div>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <Thermometer size={20} />
                <div className="detail-info">
                  <span>Feels Like</span>
                  <p>{weather.feelsLike}°C</p>
                </div>
              </div>
              <div className="detail-item">
                <Droplets size={20} />
                <div className="detail-info">
                  <span>Humidity</span>
                  <p>{weather.humidity}%</p>
                </div>
              </div>
              <div className="detail-item">
                <Wind size={20} />
                <div className="detail-info">
                  <span>Wind Speed</span>
                  <p>{weather.windSpeed} km/h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="forecast-section">
            <h3 className="section-title">7-Day Forecast</h3>
            <div className="forecast-grid">
              {weather.daily.slice(1).map((day, index) => (
                <div key={index} className="forecast-card glass">
                  <p className="day">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <div className="forecast-icon">
                    {getWeatherIcon(day.weatherCode, 32)}
                  </div>
                  <div className="temps">
                    <span className="max">{day.maxTemp}°</span>
                    <span className="min">{day.minTemp}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
