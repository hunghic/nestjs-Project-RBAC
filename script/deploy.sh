#!/bin/sh
echo '~~~~~~ Starting deploy production nest-app ~~~~~~~~~'

docker-compose pull api
docker-compose rm api -fs
docker-compose up api -d
docker-compose exec api yarn prisma migrate deploy
docker image prune -f

echo '~~~~~~ Ending deploy production nest-app ~~~~~~~~~~'
