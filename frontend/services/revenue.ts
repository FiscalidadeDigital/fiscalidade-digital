import axios from "axios";

const API_URL = "https://fiscalidade-digital-api.onrender.com/revenue";

const revenueService = {
  async findAll() {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async create(data: any) {
    const response = await axios.post(
      API_URL,
      data,
    );

    return response.data;
  },
};

export default revenueService;
