interface StatItemType {
  count: number;
  this: number;
  last: number;
  diff: number;
}

interface StatSelfType {
  year: number;
  month: number;
  week: number;
}

interface WeatherLocationType {
  city: string;
  county: string;
  displayName: string;
  latitude: number | null;
  longitude: number | null;
  source: 'gps' | 'ip' | 'server' | 'none';
  available: boolean;
}

interface WeatherCurrentType {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
  description: string;
  windSpeed: number | null;
  isDay: boolean;
}

interface WeatherDailyType {
  min: number | null;
  max: number | null;
  weatherCode: number | null;
  description: string;
  rainProbability: number | null;
}

interface WeatherInfoType {
  location: WeatherLocationType;
  updatedAt: string;
  current: WeatherCurrentType | null;
  today: WeatherDailyType | null;
  tomorrow: WeatherDailyType | null;
  stale: boolean;
  available: boolean;
}

interface HardwareInfoType {
  hostname: string;
  os: string;
  arch: string;
  cpu: {
    model: string;
    cores: number;
    percent: number | null;
    loadAvg: number[];
  };
  memory: {
    total: number | null;
    used: number | null;
    percent: number | null;
  };
  disk: {
    total: number | null;
    used: number | null;
    percent: number | null;
  };
  uptimeSeconds: number | null;
  battery: {
    percent: number;
    charging: boolean;
  } | null;
  collectedAt: string;
  available: boolean;
}
