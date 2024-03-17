import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.GEOCODING_API_BASE_URL;
const outputFormat = process.env.GEOCODING_API_OUTPUT_FORMAT;
const apiKey = process.env.GEOCODING_API_KEY;

const getCoordinates = async (street, city, zipcode) => {
  const address = `${street}, ${city}, ${zipcode}`;
  // 외부 지오코딩 API를 사용하여 위도와 경도 조회
  const url = `${baseUrl}${outputFormat}?address=${address}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const { lat, lng } = response.data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (error) {
    throw error;
  }
};

export default { getCoordinates };
