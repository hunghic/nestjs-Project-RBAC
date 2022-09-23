FROM node:16-alpine AS build

WORKDIR /app
COPY . .
RUN yarn --pure-lockfile
RUN yarn build


FROM node:16-alpine AS production

LABEL author="khiemng@vmodev.com"

WORKDIR /app
COPY package.json .
COPY prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD [ "node", "dist/main.js" ]

ARG PORT
EXPOSE ${PORT}
