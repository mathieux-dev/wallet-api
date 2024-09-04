FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
COPY . . 
EXPOSE 3000

RUN npx prisma generate
CMD [ "npm", "run", "dev" ]