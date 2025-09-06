// Geo utilities for web application
// Based on geo_service.dart from Flutter app

interface ReverseGeoResponse {
  address: {
    suburb?: string;
    city_district?: string;
    state?: string;
    country?: string;
  };
}

interface AltitudeResponse {
  results: Array<{
    elevation: number;
  }>;
}

interface WeatherResponse {
  current_weather: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
  hourly: {
    relative_humidity_2m: number[];
    pressure_msl: number[];
  };
}

interface WeatherData {
  temperature: string;
  description: string;
  humidity: string;
  pressure: string;
  wind_speed: string;
}

class GeoUtils {
  private static addressCache = new Map<string, string>();
  private static altitudeCache = new Map<string, string>();

  // Get reverse geocode
  static async getReverseGeoCode(
    latitude: number,
    longitude: number
  ): Promise<string> {
    const cacheKey = `${latitude}_${longitude}`;
    
    // Check cache first
    if (this.addressCache.has(cacheKey)) {
      return this.addressCache.get(cacheKey)!;
    }

    try {
      const isWeb = typeof window !== 'undefined';
      const baseUrl = isWeb 
        ? 'https://www.geo.mylunago.com/reverse'
        : 'http://5.189.159.178:3838/reverse';
      
      const response = await fetch(
        `${baseUrl}?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Luna IoT Reverse Geo Code'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reverse geocode');
      }

      const data: ReverseGeoResponse = await response.json();
      const address = `${data.address.suburb || ''} ${data.address.city_district || ''}, ${data.address.state || ''}, ${data.address.country || ''}`.trim();
      
      this.addressCache.set(cacheKey, address);
      return address;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Location unavailable';
    }
  }

  // Get altitude
  static async getAltitude(latitude: number, longitude: number): Promise<string> {
    const cacheKey = `${latitude}_${longitude}`;
    
    // Check cache first
    if (this.altitudeCache.has(cacheKey)) {
      return this.altitudeCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`,
        {
          headers: {
            'User-Agent': 'Luna IoT Altitude'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch altitude');
      }

      const data: AltitudeResponse = await response.json();
      const elevation = data.results[0]?.elevation || 0;
      const altitude = elevation.toString();
      
      this.altitudeCache.set(cacheKey, altitude);
      return altitude;
    } catch (error) {
      console.error('Altitude error:', error);
      return '0';
    }
  }

  // Get weather data
  static async getWeatherData(
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    const defaultWeather: WeatherData = {
      temperature: 'N/A',
      description: 'Weather data unavailable',
      humidity: 'N/A',
      pressure: 'N/A',
      wind_speed: 'N/A',
    };

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m&timezone=auto`,
        {
          headers: {
            'User-Agent': 'Luna IoT Weather'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data: WeatherResponse = await response.json();

      return {
        temperature: `${Math.round(data.current_weather.temperature || 0)}°C`,
        description: this.getWeatherDescription(data.current_weather.weathercode || 0),
        humidity: `${data.hourly.relative_humidity_2m[0] || 'N/A'}%`,
        pressure: `${Math.round(data.hourly.pressure_msl[0] || 0)} hPa`,
        wind_speed: `${Math.round(data.current_weather.windspeed || 0)} km/h`,
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return defaultWeather;
    }
  }

  // Get weather description from WMO weather codes
  private static getWeatherDescription(weatherCode: number): string {
    switch (weatherCode) {
      case 0:
        return 'Clear sky';
      case 1:
      case 2:
      case 3:
        return 'Partly cloudy';
      case 45:
      case 48:
        return 'Foggy';
      case 51:
      case 53:
      case 55:
        return 'Drizzle';
      case 56:
      case 57:
        return 'Freezing drizzle';
      case 61:
      case 63:
      case 65:
        return 'Rain';
      case 66:
      case 67:
        return 'Freezing rain';
      case 71:
      case 73:
      case 75:
        return 'Snow fall';
      case 77:
        return 'Snow grains';
      case 80:
      case 81:
      case 82:
        return 'Rain showers';
      case 85:
      case 86:
        return 'Snow showers';
      case 95:
        return 'Thunderstorm';
      case 96:
      case 99:
        return 'Thunderstorm with hail';
      default:
        return 'Unknown';
    }
  }

  // Find vehicle - open Google Maps with directions
  static findVehicle(vehicleLatitude: number, vehicleLongitude: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${vehicleLatitude},${vehicleLongitude}&travelmode=driving`;
          
          window.open(googleMapsUrl, '_blank');
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Fallback: open map centered on vehicle location
          const googleMapsUrl = `https://www.google.com/maps?q=${vehicleLatitude},${vehicleLongitude}`;
          window.open(googleMapsUrl, '_blank');
        }
      );
    } else {
      // Fallback: open map centered on vehicle location
      const googleMapsUrl = `https://www.google.com/maps?q=${vehicleLatitude},${vehicleLongitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  }

  // Open nearby places
  static openNearbyPlace(
    latitude: number,
    longitude: number,
    placeType: string
  ): void {
    const googleMapsUrl = `https://www.google.com/maps/search/${placeType}/@${latitude},${longitude},15z`;
    window.open(googleMapsUrl, '_blank');
  }
}

export default GeoUtils;
