/**
 * Weather Unit - AI-optimized weather information provider
 * Demonstrates Unit Architecture v1.0.6 with rich tool schemas
 */

import { Unit, createUnitSchema } from '@synet/unit';
import type { UnitProps, TeachingContract } from '@synet/unit';

export interface WeatherProps extends UnitProps {
  apiKey?: string;
  provider?: 'openweather' | 'mock';
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  pressure: number;
  visibility: number;
}

export interface ForecastData {
  location: string;
  days: Array<{
    date: string;
    high: number;
    low: number;
    conditions: string;
    precipitation: number;
  }>;
}

/**
 * Advanced Weather Unit with AI-first tool schemas
 * Perfect demonstration of Unit Architecture v1.0.6 integration
 */
export class WeatherUnit extends Unit<WeatherProps> {
  protected constructor(props: WeatherProps) {
    super(props);
    
    // Add native capabilities
    this._addCapability('getCurrentWeather', this.getCurrentWeather.bind(this));
    this._addCapability('getForecast', this.getForecast.bind(this));
    this._addCapability('getWeatherByCoords', this.getWeatherByCoords.bind(this));
    this._addCapability('analyzeWeatherPattern', this.analyzeWeatherPattern.bind(this));
  }

  static create(options: { apiKey?: string; provider?: 'openweather' | 'mock' } = {}): WeatherUnit {
    const props: WeatherProps = {
      dna: createUnitSchema({
        id: 'weather',
        version: '1.0.0'
      }),
      apiKey: options.apiKey,
      provider: options.provider || 'mock'
    };
    
    return new WeatherUnit(props);
  }

  // =============================================================================
  // NATIVE WEATHER CAPABILITIES
  // =============================================================================

  async getCurrentWeather(location: string): Promise<WeatherData> {
    // Mock implementation - in real world, would call weather API
    const mockData: WeatherData = {
      location,
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
      humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
      conditions: this.getRandomCondition(),
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
      visibility: Math.floor(Math.random() * 5) + 5 // 5-10 km
    };

    return mockData;
  }

  async getForecast(location: string, days = 5): Promise<ForecastData> {
    const forecast: ForecastData = {
      location,
      days: []
    };

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.days.push({
        date: date.toISOString().split('T')[0],
        high: Math.floor(Math.random() * 15) + 20, // 20-35°C
        low: Math.floor(Math.random() * 10) + 10, // 10-20°C
        conditions: this.getRandomCondition(),
        precipitation: Math.floor(Math.random() * 80) // 0-80%
      });
    }

    return forecast;
  }

  async getWeatherByCoords(latitude: number, longitude: number): Promise<WeatherData> {
    // Mock implementation using coordinates
    const location = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
    return this.getCurrentWeather(location);
  }

  async analyzeWeatherPattern(locations: string[]): Promise<string> {
    const weatherData = await Promise.all(
      locations.map(location => this.getCurrentWeather(location))
    );

    let analysis = `Meteorological Analysis for ${locations.length} regions:\n\n`;
    
    const avgTemp = weatherData.reduce((sum, data) => sum + data.temperature, 0) / weatherData.length;
    const avgHumidity = weatherData.reduce((sum, data) => sum + data.humidity, 0) / weatherData.length;
    
    for (const data of weatherData) {
      analysis += `📍 ${data.location}: ${data.temperature}°C, ${data.conditions}, `;
      analysis += `Humidity: ${data.humidity}%, Wind: ${data.windSpeed} km/h\n`;
    }
    
    analysis += `\n🌡️ Average Temperature: ${avgTemp.toFixed(1)}°C\n`;
    analysis += `💧 Average Humidity: ${avgHumidity.toFixed(1)}%\n`;
    
    if (avgTemp > 25) {
      analysis += '🔥 Generally warm conditions across regions\n';
    } else if (avgTemp < 15) {
      analysis += '❄️ Generally cool conditions across regions\n';
    } else {
      analysis += '🌤️ Moderate temperatures across regions\n';
    }

    return analysis;
  }

  private getRandomCondition(): string {
    const conditions = [
      'Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 
      'Heavy Rain', 'Thunderstorms', 'Snow', 'Fog', 'Clear'
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  capabilities(): string[] {
    return Array.from(this._capabilities.keys());
  }

  /**
   * v1.0.6 Teaching with rich tool schemas for AI integration
   * This is where the magic happens - explicit tool definitions!
   */
  teach(): TeachingContract {
    return {
      unitId: this.dna.id,
      capabilities: {
        getCurrentWeather: this.getCurrentWeather.bind(this),
        getForecast: this.getForecast.bind(this),
        getWeatherByCoords: this.getWeatherByCoords.bind(this),
        analyzeWeatherPattern: this.analyzeWeatherPattern.bind(this)
      },
      // 🔥 v1.0.6: Rich tool schemas for AI providers
      tools: {
        getCurrentWeather: {
          name: 'getCurrentWeather',
          description: 'Get current weather conditions for a specific location including temperature, humidity, conditions, wind speed, pressure, and visibility',
          parameters: {
            type: 'object',
            properties: {
              location: { 
                type: 'string', 
                description: 'City name, state/province, and country (e.g., "Paris, France" or "New York, NY, USA")' 
              }
            },
            required: ['location']
          }
        },
        getForecast: {
          name: 'getForecast',
          description: 'Get weather forecast for multiple days including daily high/low temperatures, conditions, and precipitation probability',
          parameters: {
            type: 'object',
            properties: {
              location: { 
                type: 'string', 
                description: 'City name, state/province, and country for weather forecast' 
              },
              days: { 
                type: 'number', 
                description: 'Number of days to forecast (1-10, default: 5)' 
              }
            },
            required: ['location']
          }
        },
        getWeatherByCoords: {
          name: 'getWeatherByCoords',
          description: 'Get current weather conditions using geographic coordinates (latitude/longitude)',
          parameters: {
            type: 'object',
            properties: {
              latitude: { 
                type: 'number', 
                description: 'Latitude coordinate (-90 to 90)' 
              },
              longitude: { 
                type: 'number', 
                description: 'Longitude coordinate (-180 to 180)' 
              }
            },
            required: ['latitude', 'longitude']
          }
        },
        analyzeWeatherPattern: {
          name: 'analyzeWeatherPattern',
          description: 'Analyze weather patterns across multiple locations and provide meteorological summary with trends and comparisons',
          parameters: {
            type: 'object',
            properties: {
              locations: { 
                type: 'array', 
                description: 'Array of location names to analyze (e.g., ["London, UK", "Tokyo, Japan", "Sydney, Australia"])'
              }
            },
            required: ['locations']
          }
        }
      }
    };
  }

  whoami(): string {
    return `Weather Unit v${this.dna.version} (${this.props.provider}) with ${this.capabilities().length} capabilities`;
  }

  help(): void {
    console.log(`
🌤️  Weather Unit v${this.dna.version}

CAPABILITIES:
  • getCurrentWeather(location) - Get current weather conditions
  • getForecast(location, days?) - Get multi-day weather forecast  
  • getWeatherByCoords(lat, lng) - Get weather by coordinates
  • analyzeWeatherPattern(locations[]) - Analyze weather across regions

AI INTEGRATION:
  • Rich tool schemas for perfect AI provider integration
  • Detailed parameter descriptions and validation
  • Optimized for natural language weather queries

PROVIDER: ${this.props.provider}
API KEY: ${this.props.apiKey ? '✅ Configured' : '❌ Using mock data'}

EXAMPLE USAGE:
  const weather = WeatherUnit.create();
  const data = await weather.getCurrentWeather('London, UK');
  const forecast = await weather.getForecast('Tokyo, Japan', 7);
  const analysis = await weather.analyzeWeatherPattern(['NYC', 'LA', 'Miami']);
    `);
  }
}
