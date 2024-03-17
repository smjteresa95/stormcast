import xml2js from 'xml2js';
import fs from 'fs/promises';
import db from '../../config/db.js';

const { pool } = db;

async function extractStationIds() {
  try {
    const xml = await fs.readFile('./files/stationId.xml', 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);
    const stationIds = result.wx_station_index.station.map(station => station.station_id[0]);
    return stationIds;
  } catch (err) {
    console.error(err);
  }
}

async function saveStationIds(stationIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for(const id of stationIds){
      await client.query(
        'INSERT INTO stations (station_id) VALUES ($1) ON CONFLICT (station_id) DO NOTHING',
        [id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err
  } finally{
    client.release();
  }
}

async function setStationIds(){
  const stationIds = await extractStationIds();
  await saveStationIds(stationIds);
}

async function stationIdsIsEmpty() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT EXISTS (SELECT 1 FROM stations LIMIT 1);'
    );
    return !result.rows[0].exists;
  } catch (err){
    console.error(`Error checking staions table: `, err);
    throw err;
  } finally {
    client.release();
  }
}

export default { setStationIds, stationIdsIsEmpty };
