FROM python:3.9-slim-buster

WORKDIR /app

# COPY ./requirements.txt /app/requirements.txt
COPY ./pi_requirements.txt /app/requirements.txt

# RUN pip3 install opencv-python-headless==4.4.0.44
# RUN pip3 install --no-cache-dir --upgrade -r /app/requirements.txt
# RUN pip3 install opencv-python-headless=4.4.0.44

# RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir opencv-python-headless
# RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir fastapi==0.95.2
# RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir uvicorn
# RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir pyyaml
# RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir pillow
RUN pip install --index-url=https://www.piwheels.org/simple --no-cache-dir -r /app/requirements.txt
RUN pip install --no-deps groundlight
RUN pip install --no-deps framegrab
RUN pip install pypylon

COPY ./api /app/api

EXPOSE 8000

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]