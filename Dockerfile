FROM node:12-alpine3.9
RUN apk add git
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN git log -1 > commit.txt
RUN rm -rf .git

CMD [ "npm", "start" ]

EXPOSE 3000