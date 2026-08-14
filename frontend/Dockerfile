FROM node:18-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Forzar permisos en el binario de react-scripts en caso de problemas de Windows
RUN chmod +x node_modules/.bin/react-scripts || true
EXPOSE 3000
CMD ["npm", "start"]
