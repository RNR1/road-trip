FROM hayd/alpine-deno:1.10.2

EXPOSE 8000

WORKDIR /app

ADD . /app

RUN deno cache app.ts --import-map=import_map.json --config=tsconfig.json --unstable 

CMD ["run", "--import-map=import_map.json", "--config=tsconfig.json", "--allow-net", "--allow-read", "--allow-env", "--unstable", "--allow-write", "--port=8000" "app.ts"]