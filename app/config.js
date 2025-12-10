const API_BASE_URL = process.env.MINAO_API_URL || 'http://localhost:8000/minao_systems';

const GRPC_HOST = process.env.MINAO_GRPC_HOST || 'localhost:50051'; 

module.exports = {
    API_BASE_URL,
    GRPC_HOST
};