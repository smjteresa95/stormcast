import express from 'express';
import dotenv from "dotenv";
import weatherRoutes from './src/routes/weatherRoutes.js';

const app = express();

dotenv.config();
const port = process.env.EXPRESS_PORT;

app.use(express.json());
app.use('/api', weatherRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


// initStationIds().catch(console.error);

// geocodingService.getCoordinates('1600 Amphitheatre Parkway', 'Mountain View', '94043')
//   .then(coordinates => console.log(coordinates))
//   .catch(error => console.error(error));

