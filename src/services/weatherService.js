import axios from 'axios';
import dotenv from "dotenv";
import db from '../../config/db.js';

const { pool } = db;

dotenv.config();

const baseUrl = process.env.WEATHER_API_BASE_URL;
const batchSize = Number(process.env.WEATHER_API_STATION_BATCH_SIZE);
const startTime = process.env.WEATHER_API_START_TIME;
const endTime = process.env.WEATHER_API_END_TIME;

const getAllStationIds = async () => {
    try {
        const result = await pool.query('SELECT station_id FROM stations');
        return result.rows.map(row => row.station_id);
    } catch (err) {
        console.error('Error retrieving station IDs: ', err);
        return [];
    }
}

const fetchWeatherData = async (stationId, startDate, endDate) => {
    try {
        // const response = await axios.get(`${baseUrl}/stations/${stationId}/observations`, {
        //     param: {
        //         start: startDate,
        //         end: endDate
        //     }
        // });
        const response = await axios.get(`${baseUrl}/stations/${stationId}/observations?start=${startDate}&end=${endDate}`);
        return response.data;
    } catch (err) {
        console.error(`Error fetching weather data for stationId ${stationId}`);
        return null;
    }
}

const saveWeatherData = async (data) => {
    if(!data || !data.features) return;
    try {
        for (const observation of data.features) {
            const observationValues = getObservationValues(observation.properties);
            
            const queryParams = [
                observationValues.stationId,
                observationValues.timestamp,
                observationValues.textDescription,
                observationValues.temperature,
                observationValues.dewpoint,
                observationValues.windDirection,
                observationValues.windSpeed,
                observationValues.windGust,
                observationValues.barometricPressure,
                observationValues.seaLevelPressure,
                observationValues.visibility,
                observationValues.maxTemperatureLast24Hours,
                observationValues.minTemperatureLast24Hours,
                observationValues.precipitationLastHour,
                observationValues.precipitationLast3Hours,
                observationValues.precipitationLast6Hours,
                observationValues.relativeHumidity,
                observationValues.windChill,
                observationValues.heatIndex,
            ];

            await pool.query(insertWeatherQuery, queryParams);
        }
    } catch (err){
        console.error('Error saving weather data to the databse', err);
    }
}

const processWeatherDataInBatches = async (today) => {

    const startTimer = process.hrtime(); //start high-resolution timer

    const stationIds = await getAllStationIds();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() -1);
    const startDate = yesterday.toISOString().split('T')[0] + startTime;
    const endDate = yesterday.toISOString().split('T')[0] + endTime;

    try {
        for (let i = 0; i < stationIds.length; i += batchSize) {
            const batchStationIds = stationIds.slice(i, i + batchSize);
            for (const stationId of batchStationIds) {
                const fetchPromises = batchStationIds.map(stationId => 
                    fetchWeatherData(stationId, startDate, endDate)
                    .then(data => saveWeatherData(data))
                    .catch(err => console.error(`Failed to fetch/save data for station ${stationId}:`, err))
                );
                await Promise.all(fetchPromises);
            }
            console.log(`Processed batch from ${i} to ${i + batchSize}`);
        }
    } catch (err) {
        console.log(`Error processing batch between ${i} and ${i + batchSize}: ${err}`);
    } finally {
        const endTimer = process.hrtime(startTimer); //end high-resolution timer
        const timeInSeconds = (endTimer[0] *1e9 + endTimer[1]) / 1e9; //convert [seconds, nanoseconds] to seconds
        console.log(`saveWeatherData: ${timeInSeconds.toFixed(3)} seconds`);
    }
}

function getObservationValues(properties) {
    // 값이 유효한지 확인하고, 소수점 두 자리까지 반올림하는 함수
    const safeFormat = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        return parseFloat(value.toFixed(2));
    };

    return {
        stationId: properties.station.match(/stations\/(\w+)$/)[1],
        timestamp: properties.timestamp,
        textDescription: properties.textDescription,
        temperature: safeFormat(properties.temperature?.value),
        dewpoint: safeFormat(properties.dewpoint?.value),
        windDirection: safeFormat(properties.windDirection?.value),
        windSpeed: safeFormat(properties.windSpeed?.value),
        windGust: safeFormat(properties.windGust?.value),
        barometricPressure: safeFormat(properties.barometricPressure?.value),
        seaLevelPressure: safeFormat(properties.seaLevelPressure?.value),
        visibility: safeFormat(properties.visibility?.value),
        maxTemperatureLast24Hours: safeFormat(properties.maxTemperatureLast24Hours?.value),
        minTemperatureLast24Hours: safeFormat(properties.minTemperatureLast24Hours?.value),
        precipitationLastHour: safeFormat(properties.precipitationLastHour?.value),
        precipitationLast3Hours: safeFormat(properties.precipitationLast3Hours?.value),
        precipitationLast6Hours: safeFormat(properties.precipitationLast6Hours?.value),
        relativeHumidity: safeFormat(properties.relativeHumidity?.value),
        windChill: safeFormat(properties.windChill?.value),
        heatIndex: safeFormat(properties.heatIndex?.value),
    };
}


const insertWeatherQuery = `
    INSERT INTO weather_observations (
    station_id, observation_time, text_description, temperature, dewpoint,
        wind_direction, wind_speed, wind_gust, barometric_pressure, sea_level_pressure,
        visibility, max_temp_last_24_hrs, min_temp_last_24_hrs, precipitation_last_hr,
        precipitation_last_3_hrs, precipitation_last_6_hrs, relative_humidity, wind_chill,
        heat_index
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) ON CONFLICT (station_id, observation_time) DO NOTHING;
`;

export default { processWeatherDataInBatches };