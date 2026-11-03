
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV DATABASE_URL="mysql://root:1111@mysql:3306/presensi_db"

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
