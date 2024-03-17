import weatherService from '../services/weatherService.js';
import weatherStationService from '../services/weatherStationService.js';

const { processWeatherDataInBatches } = weatherService;
const { loadStationFunctions } = weatherStationService;

const initStationIds = async () => {
  if(await loadStationFunctions.stationIdsIsEmpty()){
      await loadStationFunctions.setStationIds();
      console.log(`Station ids have been updated in the database`);
  } else {
      console.log('stations table is already populated');
  }
}

const saveWeatherData = async (req, res) => {
  try {
    const { today } = req.params;

    if (!today) {
      res.status(400).send({
        message: "Missing 'today' date in request"
      });
      return;
    }

    await processWeatherDataInBatches(today);

    res.status(200).send({
      message: 'weather data processed successfully'
    });
  } catch (err) {
    console.error('Failed to process weather data', err);
    res.status(500).send({
      message: 'Internal server error'
    });
  }
}

export default { saveWeatherData, initStationIds };