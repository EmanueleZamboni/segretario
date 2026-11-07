# WhatsApp del Segretario: un processo Node (Baileys) dietro il Caddy di Postino, raggiunto come whatsapp:8787.
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
# Stesso uid del Segretario e di Postino (node = 1000): il volume /data è suo.
RUN mkdir /data && chown 1000:1000 /data
ENV NODE_ENV=production \
    NODE_OPTIONS=--disable-warning=ExperimentalWarning \
    WHATSAPP_DATA_DIR=/data \
    HOST=0.0.0.0 \
    PORT=8787
VOLUME ["/data"]
EXPOSE 8787
USER 1000
ENTRYPOINT ["node", "src/cli.js"]
CMD ["serve", "--http"]
