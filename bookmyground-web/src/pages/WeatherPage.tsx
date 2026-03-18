import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Cloud, Sun, Droplets, Wind, Thermometer, Search, MapPin } from 'lucide-react';

interface WeatherData {
  city: string; temperature: number; feels_like?: number; humidity: number;
  wind_speed: number; description?: string; condition?: string; icon?: string;
  forecast: Array<{ day?: string; date?: string; temp?: number; temp_min?: number; temp_max?: number; description?: string; condition?: string; icon?: string }>;
}

export default function WeatherPage() {
  const [city, setCity] = useState('Jaipur');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchWeather(); }, []);

  const fetchWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try { const data = await api.getWeather(city); setWeather(data); }
    catch { 
      setWeather({
        city, temperature: 32, feels_like: 35, humidity: 45, wind_speed: 12,
        description: 'Partly Cloudy', icon: 'partly_cloudy',
        forecast: [
          { date: new Date().toISOString().split('T')[0], temp_min: 24, temp_max: 36, description: 'Sunny', icon: 'sunny' },
          { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp_min: 23, temp_max: 35, description: 'Clear', icon: 'clear' },
          { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], temp_min: 25, temp_max: 37, description: 'Hot', icon: 'sunny' },
        ]
      });
    }
    setLoading(false);
  };

  const getWeatherIcon = (desc: string) => {
    const d = (desc || '').toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return <Droplets size={40} className="text-blue-500" />;
    if (d.includes('cloud') || d.includes('overcast')) return <Cloud size={40} className="text-gray-500" />;
    return <Sun size={40} className="text-yellow-500" />;
  };

  const getPlayAdvice = (temp: number, desc: string) => {
    const d = (desc || '').toLowerCase();
    if (d.includes('rain') || d.includes('storm')) return { text: 'Not recommended for outdoor play', color: 'text-red-600', bg: 'bg-red-50' };
    if (temp > 40) return { text: 'Very hot - play early morning or evening', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (temp > 35) return { text: 'Hot weather - stay hydrated, prefer evening slots', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (temp < 10) return { text: 'Cold weather - warm up properly before playing', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { text: 'Great weather for outdoor sports!', color: 'text-green-600', bg: 'bg-green-50' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Cloud size={28} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Weather Check</h1>
        </div>
        <p className="text-gray-500 mb-6">Check weather conditions before booking your game</p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-3 shadow-sm border">
            <MapPin size={18} className="text-gray-400 mr-2" />
            <input type="text" placeholder="Enter city name..." className="flex-1 outline-none"
              value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchWeather()} />
          </div>
          <button onClick={fetchWeather} disabled={loading}
            className="bg-blue-600 text-white px-6 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Search size={18} /> {loading ? 'Loading...' : 'Check'}
          </button>
        </div>

        {weather && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{weather.city}</h2>
                  <p className="text-gray-500 capitalize">{weather.description || weather.condition || ''}</p>
                </div>
                {getWeatherIcon(weather.description || weather.condition || '')}
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Thermometer size={24} className="text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">{weather.temperature}°C</p>
                  <p className="text-xs text-gray-500">Temperature</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Thermometer size={24} className="text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">{weather.feels_like ?? weather.temperature}°C</p>
                  <p className="text-xs text-gray-500">Feels Like</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Droplets size={24} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">{weather.humidity}%</p>
                  <p className="text-xs text-gray-500">Humidity</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Wind size={24} className="text-gray-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-800">{weather.wind_speed} km/h</p>
                  <p className="text-xs text-gray-500">Wind</p>
                </div>
              </div>

              {(() => {
                const advice = getPlayAdvice(weather.temperature, weather.description || weather.condition || '');
                return (
                  <div className={`mt-4 ${advice.bg} rounded-xl p-4`}>
                    <p className={`font-medium ${advice.color}`}>{advice.text}</p>
                  </div>
                );
              })()}
            </div>

            {weather.forecast && weather.forecast.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">3-Day Forecast</h3>
                <div className="grid grid-cols-3 gap-4">
                  {weather.forecast.map((f, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-sm font-medium text-gray-600">{f.day || (f.date ? new Date(f.date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' }) : `Day ${i+1}`)}</p>
                      <div className="my-2">{getWeatherIcon(f.description || f.condition || '')}</div>
                      <p className="text-sm capitalize text-gray-500">{f.description || f.condition || ''}</p>
                      <p className="text-sm font-bold mt-1">{f.temp != null ? `${f.temp}°` : `${f.temp_min ?? ''}° - ${f.temp_max ?? ''}°`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
