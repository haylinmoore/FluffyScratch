FROM node:10-alpine3.9 as npmpackages
WORKDIR /app
COPY package.json .
RUN npm install

FROM node:10-alpine3.9
WORKDIR /app
COPY --from=npmpackages /app /app
COPY . .
CMD [ "npm", "start" ]

EXPOSE 3000