FROM hugomods/hugo:exts-0.155.2 AS builder
WORKDIR /src
COPY . .
RUN hugo --minify --baseURL "https://preview.meeresoffensive.cryptolight.io"

FROM nginx:alpine
COPY --from=builder /src/public /usr/share/nginx/html
EXPOSE 80