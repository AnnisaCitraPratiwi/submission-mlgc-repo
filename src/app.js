require('dotenv').config();

const Hapi = require('@hapi/hapi');
const { loadModel, predict, storeData,getHistories } = require('./inference');
const crypto = require('crypto');

const MAX_FILE_SIZE = 1000000; // 1MB in bytes

(async () => {
  try {
    // Initialize HTTP server
    const server = Hapi.server({
      host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
      port: 8080,
    });

    // Load model
    const model = await loadModel();
    server.app.model = model; // Now 'server' is initialized
    console.log('Model loaded successfully!');

    // Add a global handler for custom error responses
    server.ext('onPreResponse', (request, h) => {
      const response = request.response;

      // Check if error is because of payload size exceeding limit (413)
      if (response.isBoom && response.output.statusCode === 413) {
        return h.response({
          status: 'fail',
          message: 'Payload content length greater than maximum allowed: 1000000',
        }).code(413);
      }

      return h.continue;
    });

    // Route for prediction
    server.route({
      method: 'POST',
      path: '/predict',
      handler: async (request, h) => {
        try {
          // Get image uploaded by the user
          const { image } = request.payload;

          // Check if image exists
          if (!image) {
            return h.response({
              status: 'fail',
              message: 'Terjadi kesalahan dalam melakukan prediksi',
            }).code(400);
          }
          console.log('Received file:', image.hapi);
          console.log('File size:', image.bytes);

          // Check file size
          if (image.bytes > MAX_FILE_SIZE) {
            return h.response({
              status: 'fail',
              message: 'Payload content length greater than maximum allowed: 1000000',
            }).code(413);
          }

          // Do prediction
          const isCancer = await predict(server.app.model, image._data);
          
          // Prepare response
          const response = {
            status: 'success',
            message: 'Model is predicted successfully',
            data: {
              id: crypto.randomUUID(),
              result: isCancer ? 'Cancer' : 'Non-cancer',
              suggestion: isCancer
                ? 'Segera periksa ke dokter!'
                : 'Penyakit kanker tidak terdeteksi.',
              createdAt: new Date().toISOString(),
            },
          };

          await storeData(response.data.id, response);

          return h.response(response).code(201);

        } catch (error) {
          console.error('Prediction error:', error);
          return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan dalam melakukan prediksi',
          }).code(400);
        }
      },
      options: {
        payload: {
          allow: 'multipart/form-data',
          multipart: true,
          maxBytes: MAX_FILE_SIZE,
          output: 'stream',
        },
      },
    });

    // Route for fetching prediction histories
    server.route({
      method: 'GET',
      path: '/predict/histories',
      handler: async (request, h) => {
        try {
          const histories = await getHistories();

          return h.response({
            status: 'success',
            data: histories,
          }).code(200);
        } catch (error) {
          console.error('Error fetching histories:', error);
          return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan dalam mengambil data riwayat prediksi',
          }).code(500);
        }
      },
    });
    
    // Running server
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
