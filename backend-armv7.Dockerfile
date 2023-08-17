FROM python:3.9-slim-buster

WORKDIR /app

COPY ./pi_requirements.txt /app/requirements.txt

RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r /app/requirements.txt
RUN pip install --no-deps groundlight
RUN pip install --no-deps framegrab
RUN pip install pypylon

COPY ./api /app/api

EXPOSE 8000

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000", " --log-config", "api/logging_config.yaml"]