FROM python:3.11-slim

WORKDIR /app

COPY relay-server/relay_server.py .

EXPOSE 8080

CMD ["python3", "relay_server.py"]
