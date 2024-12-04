const tfjs = require('@tensorflow/tfjs-node');
const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore
const db = new Firestore();
const predictCollection = db.collection('predictions');

async function loadModel() {
    return tfjs.loadGraphModel(process.env.MODEL_URL);
}

async function predict(model, imageBuffer) {
    try {
        const tensor = tfjs.node
            .decodeImage(imageBuffer, 3)  
            .resizeNearestNeighbor([224, 224])  
            .expandDims()
            .toFloat();

        const predictions = await model.predict(tensor).data();
        tensor.dispose();

        // Kembalikan true jika prediksi > 0.5 (50%)
        const predictionValue = predictions[0];
        console.log('Prediction Value:', predictionValue);
        return predictionValue > 0.5;

    } catch (error) {
        console.error('Error during prediction:', error);
        throw new Error('Failed to process image for prediction');
    }
}

async function storeData(id, data) {
    return predictCollection.doc(id).set(data);
}

async function getHistories() {
  try {
      const snapshot = await predictCollection.get();
      if (snapshot.empty) {
          return [];
      }

      // Format data menjadi array dengan struktur yang sesuai
      const histories = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              history: {
                  id: doc.id,
                  result: data.data.result,
                  createdAt: data.data.createdAt,
                  suggestion: data.data.suggestion,
              },
          };
      });

      return histories;
  } catch (error) {
      console.error('Error fetching prediction histories:', error);
      throw new Error('Failed to fetch prediction histories');
  }
}

// Export semua fungsi yang dibutuhkan
module.exports = { 
    loadModel, 
    predict,
    storeData,
    getHistories  
};