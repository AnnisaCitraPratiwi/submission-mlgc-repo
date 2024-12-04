# Gunakan image resmi Node.js versi LTS sebagai base image
FROM node:18-bullseye-slim

# Install library sistem yang diperlukan
RUN apt-get update && apt-get install -y \
    libc6 \
    libstdc++6 \
    libgcc1 \
    wget \
    && apt-get clean

# Install TensorFlow dari binary
RUN wget https://storage.googleapis.com/tensorflow/libtensorflow/libtensorflow-cpu-linux-x86_64-2.11.0.tar.gz && \
    tar -C /usr/local -xzf libtensorflow-cpu-linux-x86_64-2.11.0.tar.gz && \
    ldconfig && \
    rm libtensorflow-cpu-linux-x86_64-2.11.0.tar.gz

# Set working directory di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh kode sumber aplikasi
COPY src/ ./src/

# Tambahkan file .env jika diperlukan (pastikan tidak menyimpan kredensial sensitif di sini)
# COPY .env ./

# Ekspos port yang digunakan aplikasi
EXPOSE 8080

# Set environment ke production
ENV NODE_ENV=production

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]