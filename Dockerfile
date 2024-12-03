# Gunakan image Node.js resmi
FROM node:18-slim

# Set working directory dalam container
WORKDIR /src

# Salin file package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependensi aplikasi (termasuk dependencies dan devDependencies)
RUN npm install

# Salin semua file aplikasi ke dalam container
COPY . .

# Expose port yang digunakan oleh aplikasi
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "src/app.js"]
