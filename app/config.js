const API_BASE_URL = "https://nonrevocable-continuous-lakendra.ngrok-free.dev/minao_systems";
const FETCH_TIMEOUT = 10000;
const GRPC_HOST = process.env.MINAO_GRPC_HOST || 'localhost:50051'; 

module.exports = {
    API_BASE_URL,
    GRPC_HOST,
    FETCH_TIMEOUT
};