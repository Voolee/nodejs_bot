FROM node:14

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Делаем файл wait-for-it.sh исполняемым
RUN chmod +x wait-for-it.sh

CMD ["node", "bot2.js"]
