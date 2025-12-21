FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma/schema.prisma ./prisma/

RUN npx prisma generate

# RUN npx prisma migrate dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]