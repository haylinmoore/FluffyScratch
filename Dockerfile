FROM node:12-alpine3.9
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .

CMD [ "npm", "start" ]

EXPOSE 3000