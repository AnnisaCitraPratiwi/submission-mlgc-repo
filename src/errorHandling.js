class ClientError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ClientError';
    }
}

class InputError extends ClientError {
    constructor(message) {
        super(message);
        this.name = 'InputError';
    }
}

// Global error handler
const handleError = (error, h) => {
    if (error instanceof ClientError) {
        return h.response({
            status: 'fail',
            message: error.message,
        }).code(error.statusCode);
    }

    // Internal Server Error (500) for unhandled errors
    console.error('Unexpected error:', error);
    return h.response({
        status: 'error',
        message: 'Terjadi kesalahan dalam melakukan prediksi',
    }).code(400);  // As per your request, 400 is returned for any error in prediction
};

module.exports = {
    ClientError,
    InputError,
    handleError,
};
