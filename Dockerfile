FROM hugomods/hugo:dart-sass-0.155.3 AS builder
WORKDIR /src
COPY . .
RUN hugo --minify --baseURL "https://preview.meeresoffensive.cryptolight.io"

FROM nginx:alpine
COPY --from=builder /src/public /usr/share/nginx/html
EXPOSE 80