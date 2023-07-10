FROM nikolaik/python-nodejs:python3.11-nodejs20-slim

WORKDIR /usr/src/app

COPY requirements.txt ./
COPY package*.json ./

RUN pip install -r requirements.txt
RUN npm install
RUN pip install opencv-python-headless

RUN apt update && apt install -y libsm6 libxext6
RUN apt-get install -y libxrender-dev

COPY . .

RUN touch ./api/gl_config.json
# RUN apk add --update nodejs npm

CMD ["npm", "run", "dev"]