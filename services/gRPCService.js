const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path'); 

const { GRPC_HOST } = require('../app/config'); 
const PROTO_PATH = path.join(__dirname, '../grpc/protos/content.proto');


const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const content_proto = grpc.loadPackageDefinition(packageDefinition).content; 
const client = new content_proto.ContentService(GRPC_HOST, grpc.credentials.createInsecure());
const CHUNK_SIZE = 1024 * 1024; 
const BASE_URL_VIEW = "http://localhost:8000/minao_systems/content/files/view";


function uploadContent(uploadData) {
    return new Promise((resolve, reject) => {
    
        const fileContentBuffer = uploadData.fileContent;
        const totalSize = fileContentBuffer.length;
        
        const call = client.UploadContentFile((error, response) => {
            if (error) {
                console.error('gRPC Streaming Error:', error);
                return reject(new Error(error.details || 'Fallo de conexión gRPC durante el streaming.'));
            }
        
            resolve({ success: response.success, message: response.message || 'Archivo procesado.' });
        });

        let offset = 0;
        
        function writeNextChunk() {
            if (offset < totalSize) {
                const chunk = fileContentBuffer.slice(offset, offset + CHUNK_SIZE);
                offset += CHUNK_SIZE;

                const chunkMessage = {
                    contentId: parseInt(uploadData.moduleId), 
                    fileName: uploadData.fileName,
                    fileType: uploadData.fileMimeType,
                    data: chunk 
                };

                const canContinue = call.write(chunkMessage);
                
                if (!canContinue) {
                    call.once('drain', writeNextChunk);
                } else {
                    writeNextChunk();
                }
            } else {
                call.end(); 
            }
        }
        
        writeNextChunk();
        
        call.on('error', reject); 
    });
}

function getFilesByContent(contentId) {
    return new Promise((resolve, reject) => {
        const request = {
            contentId: parseInt(contentId) 
        };
        console.log("GetFilesByContent request:", request, "host:", GRPC_HOST, "proto:", PROTO_PATH);
        client.GetFilesByContent(request, (error, response) => { 
            if (error) {
                console.error('gRPC GetFilesByContent Error:', error);
                return reject(new Error(error.details || 'Fallo al obtener la lista de archivos.'));
            }
            
            resolve({ 
                success: response.success, 
                files: response.files || [], 
                message: response.message 
            });
        });
    });
}

function deleteContentFile(fileId) {
    return new Promise((resolve, reject) => {
        const request = {
            fileId: parseInt(fileId) 
        };

        client.DeleteFile(request, (error, response) => { 
            if (error) {
                console.error('gRPC DeleteFile Error:', error);
                return reject(new Error(error.details || 'Fallo al eliminar el archivo gRPC.'));
            }
            resolve({ 
                success: response.success, 
                message: response.message 
            });
        });
    });
}

function getFileViewUrl(fileUrl) {
    if (!fileUrl) return "";

    const filename = fileUrl.split('/').pop();
    return `${BASE_URL_VIEW}/${encodeURIComponent(filename)}`;
}



module.exports = { uploadContent, getFilesByContent, deleteContentFile, getFileViewUrl };