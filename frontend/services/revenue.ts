import api from './api';

const revenueService = {
  async findAll() {
    const response = await api.get('/revenue');
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/revenue', data);

    return response.data;
  },
};

export default revenueService;
