# syntax=docker/dockerfile:1
FROM --platform=linux/arm64 node:22-alpine

WORKDIR /app

# 의존성 파일 복사 후 설치 (캐시 최적화)
COPY package*.json ./
RUN npm install

# 소스 복사
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
