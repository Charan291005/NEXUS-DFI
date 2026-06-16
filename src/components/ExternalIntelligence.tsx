import { useEffect, useState } from 'react';
import { Card, SectionHeader, Spinner } from './ui';
import axios from 'axios';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
}

interface CryptoData {
  bitcoin: { usd: number; usd_24h_change?: number };
  ethereum: { usd: number; usd_24h_change?: number };
  monero: { usd: number; usd_24h_change?: number };
}

interface GithubUser {
  login: string;
  name: string;
  public_repos: number;
  followers: number;
  avatar_url: string;
  created_at: string;
}

export function ExternalIntelligence() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [crypto, setCrypto] = useState<CryptoData | null>(null);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
  const [githubInput, setGithubInput] = useState('octocat');
  const [githubLoading, setGithubLoading] = useState(false);

  // Fetch Weather
  useEffect(() => {
    // Default to New York coordinates if geolocation fails
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        setWeather(res.data.current_weather);
      } catch (err) {
        console.error('Failed to fetch weather', err);
      } finally {
        setWeatherLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(40.7128, -74.0060) // Fallback NYC
      );
    } else {
      fetchWeather(40.7128, -74.0060);
    }
  }, []);

  // Fetch Crypto
  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,monero&vs_currencies=usd&include_24hr_change=true');
        setCrypto(res.data);
      } catch (err) {
        console.error('Failed to fetch crypto', err);
      } finally {
        setCryptoLoading(false);
      }
    };
    fetchCrypto();
  }, []);

  // Fetch GitHub User
  const fetchGithub = async (username: string) => {
    if (!username) return;
    setGithubLoading(true);
    try {
      const res = await axios.get(`https://api.github.com/users/${username}`);
      setGithubUser(res.data);
    } catch (err) {
      console.error('Failed to fetch GitHub user', err);
      setGithubUser(null);
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    fetchGithub('octocat');
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return '☀️'; // clear / partly cloudy
    if (code <= 67) return '🌧️'; // rain
    if (code <= 77) return '❄️'; // snow
    return '⛈️'; // thunderstorm / other
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="External OSINT Intelligence" subtitle="Live data feeds via Free APIs" icon="🌍" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Weather API Card */}
        <Card className="flex flex-col relative overflow-hidden group">
          <h3 className="text-sm font-semibold text-navy-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>☁️</span> Local Weather
          </h3>
          {weatherLoading ? (
            <div className="flex-1 flex justify-center items-center py-4"><Spinner size="sm" /></div>
          ) : weather ? (
            <div className="flex items-center justify-between mt-auto">
              <div>
                <p className="text-4xl font-display text-white">{weather.temperature}°C</p>
                <p className="text-xs text-navy-400 mt-1 flex items-center gap-2">
                  <span className="text-accent-400">Wind:</span> {weather.windspeed} km/h
                </p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">
                {getWeatherIcon(weather.weathercode)}
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400">Failed to load weather data.</p>
          )}
          <div className="absolute top-0 right-0 bg-accent-500/10 text-accent-400 text-[9px] px-2 py-0.5 rounded-bl-lg font-mono">Open-Meteo</div>
        </Card>

        {/* Crypto API Card */}
        <Card className="flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-semibold text-navy-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>💰</span> Crypto Rates
          </h3>
          {cryptoLoading ? (
            <div className="flex-1 flex justify-center items-center py-4"><Spinner size="sm" /></div>
          ) : crypto ? (
            <div className="space-y-2 mt-auto">
              {[
                { name: 'Bitcoin', key: 'bitcoin', symbol: '₿' },
                { name: 'Ethereum', key: 'ethereum', symbol: 'Ξ' },
                { name: 'Monero', key: 'monero', symbol: 'ɱ' },
              ].map(coin => {
                const data = crypto[coin.key as keyof CryptoData];
                if (!data) return null;
                const isUp = (data.usd_24h_change || 0) >= 0;
                return (
                  <div key={coin.key} className="flex justify-between items-center text-sm">
                    <span className="text-navy-200">{coin.symbol} {coin.name}</span>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-mono text-white">${data.usd.toLocaleString()}</span>
                      <span className={`text-[10px] ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{data.usd_24h_change?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-red-400">Failed to load crypto data.</p>
          )}
          <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-400 text-[9px] px-2 py-0.5 rounded-bl-lg font-mono">CoinGecko</div>
        </Card>

        {/* GitHub API Card */}
        <Card className="flex flex-col relative overflow-hidden">
          <h3 className="text-sm font-semibold text-navy-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>🐙</span> GitHub OSINT
          </h3>
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={githubInput}
              onChange={e => setGithubInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchGithub(githubInput)}
              placeholder="Username..." 
              className="input-cyber w-full py-1 text-xs px-2"
            />
            <button 
              onClick={() => fetchGithub(githubInput)}
              className="btn-cyber btn-primary text-xs px-3 py-1"
            >
              Search
            </button>
          </div>
          {githubLoading ? (
            <div className="flex-1 flex justify-center items-center py-2"><Spinner size="sm" /></div>
          ) : githubUser ? (
            <div className="flex items-center gap-3">
              <img src={githubUser.avatar_url} alt="avatar" className="w-10 h-10 rounded-lg border border-navy-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{githubUser.name || githubUser.login}</p>
                <div className="flex justify-between mt-1 text-[10px] text-navy-400 font-mono">
                  <span>{githubUser.public_repos} repos</span>
                  <span>{githubUser.followers} followers</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400">User not found.</p>
          )}
          <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded-bl-lg font-mono">GitHub</div>
        </Card>
      </div>
    </div>
  );
}
