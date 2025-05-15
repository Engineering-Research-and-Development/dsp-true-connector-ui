FROM node:lts-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/tc_dsp_ui /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

COPY replace-env.sh /docker-entrypoint.d/

RUN chmod +x /docker-entrypoint.d/replace-env.sh

HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.d/replace-env.sh"]
CMD ["nginx", "-g", "daemon off;"]