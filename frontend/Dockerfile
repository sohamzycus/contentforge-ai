FROM node:20-slim

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --network-timeout 100000

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"]
