/**
 * Weather Unit Demo - Testing weather unit capabilities
 * 
 * This demo tests:
 * 1. Weather unit creation and configuration
 * 2. Current weather retrieval  
 * 3. Weather forecasting
 * 4. Location search and coordinates
 * 5. Error handling for invalid inputs
 */
import { readFileSync } from 'node:fs';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import path from 'node:path';

async function weatherUnitDemo() {
  console.log('🌤️  Weather Unit Demo - Testing Core Capabilities\n');

  // Load real API key
  const openweatherConfig = JSON.parse(
    readFileSync(path.join('private', 'openweather.json'), 'utf-8')
  );

  // 1. Create weather unit with real API key
  const weather = WeatherUnit.create({
    apiKey: openweatherConfig.apiKey,
    defaultUnits: 'metric',
    timeout: 10000
  });

  console.log('📚 Weather Unit Information:');
  console.log(weather.whoami());
  console.log(`Available capabilities: ${weather.capabilities().list().join(', ')}`);
  console.log();

  // 2. Test current weather
  console.log('🌡️  Testing current weather...');
  try {
    const currentWeather = await weather.getCurrentWeather('Tokyo', 'metric');
    console.log('✅ Current weather in Tokyo:');
    console.log(`   Location: ${currentWeather.location}, ${currentWeather.country}`);
    console.log(`   Temperature: ${currentWeather.temperature}°C (feels like ${currentWeather.feelsLike}°C)`);
    console.log(`   Description: ${currentWeather.description}`);
    console.log(`   Humidity: ${currentWeather.humidity}%`);
    console.log(`   Pressure: ${currentWeather.pressure} hPa`);
    console.log(`   Wind: ${currentWeather.windSpeed} m/s`);
    console.log(`   Visibility: ${currentWeather.visibility}m`);
    console.log();
  } catch (error) {
    console.error('❌ Error getting current weather:', error);
  }

  // 3. Test weather forecast
  console.log('📅 Testing weather forecast...');
  try {
    const forecast = await weather.getForecast('London', 3);
    console.log(`✅ 3-day forecast for ${forecast.location}, ${forecast.country}:`);
    for (const day of forecast.forecasts) {
      console.log(`   ${day.date}: ${day.high}°/${day.low}°C - ${day.description} (${day.precipitation}mm rain)`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error getting forecast:', error);
  }

  // 4. Test weather by coordinates
  console.log('🗺️  Testing weather by coordinates...');
  try {
    const coordWeather = await weather.getWeatherByCoords(35.6762, 139.6503, 'metric');
    console.log('✅ Weather at Tokyo coordinates (35.6762, 139.6503):');
    console.log(`   Location: ${coordWeather.location}, ${coordWeather.country}`);
    console.log(`   Temperature: ${coordWeather.temperature}°C`);
    console.log(`   Description: ${coordWeather.description}`);
    console.log();
  } catch (error) {
    console.error('❌ Error getting weather by coordinates:', error);
  }

  // 5. Test location search
  console.log('🔍 Testing location search...');
  try {
    const locations = await weather.searchLocation('Paris');
    console.log('✅ Search results for "Paris":');
    for (const location of locations.slice(0, 3)) {
      console.log(`   ${location.name}, ${location.country} (${location.lat}, ${location.lon})`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error searching locations:', error);
  }

  // 6. Test error handling
  console.log('⚠️  Testing error handling...');
  try {
    await weather.getCurrentWeather('InvalidCityNameThatDoesNotExist123');
  } catch (error) {
    console.log('✅ Error handling works correctly:');
    console.log(`   ${error}`);
    console.log();
  }

  // 7. Test teaching contract
  console.log('📚 Testing teaching contract...');
  const teachingContract = weather.teach();
  console.log('✅ Teaching contract:');
  console.log(`   Unit ID: ${teachingContract.unitId}`);
  console.log(`   Capabilities: ${teachingContract.capabilities.list().join(', ')}`);
  console.log(`   Tool schemas: ${teachingContract.schema.list().join(', ')}`);
  console.log();

  console.log('🎉 Weather Unit Demo Complete!');
}

// Run demo
weatherUnitDemo().catch(console.error);
