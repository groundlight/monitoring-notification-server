FROM python:3.11-slim-bookworm

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip3 install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./api /app/api

EXPOSE 8000

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]