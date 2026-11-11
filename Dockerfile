# Segretario: memoria condivisa per Claude, un processo Python dietro il Caddy di Postino.
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt
COPY server.py guardia.py oauth.py remoti.py backup.py drive.py telegram_bot.py keep.py brief.py fonti.py pagine.py icone.py voce.py voce.html voce_mesh.js voce_testa.js voce_scena.js voce_logica.js .
COPY docs/istruzioni_progetto_secretary.md docs/manuale_segretario.md docs/
# Stesso uid di Postino (node = 1000): il volume /data è suo.
RUN useradd --uid 1000 --system --shell /usr/sbin/nologin segretario && mkdir /data && chown 1000:1000 /data
ENV SEGRETARIO_DATA=/data PORT=8766 BIND=0.0.0.0 PYTHONUNBUFFERED=1
VOLUME ["/data"]
EXPOSE 8766
USER 1000
CMD ["python", "server.py"]
