const API_BASE_URL = "http://localhost:3002/minao_systems";
const FETCH_TIMEOUT = 10000;
const GRPC_HOST = process.env.MINAO_GRPC_HOST || 'localhost:50051'; 

module.exports = {
    API_BASE_URL,
    GRPC_HOST,
    FETCH_TIMEOUT
};