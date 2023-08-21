<p align="center">
  <a href="https://nextjs-fastapi-starter.vercel.app/">
    <img src="https://avatars.githubusercontent.com/u/118213576?s=200&v=4" height="96">
    <h3 align="center">Monitoring Notification Server</h3>
  </a>
</p>

<br/>

## What is the Monitoring Notification Server?

Our Monitoring Notification Server is a server you can deploy anywhere to easily build Groundlight Detectors, and configure them to pull from custom image sources and post notifications.

The Monitoring Notification Server has a simple web interface (depected below) that allows you to configure your detector, and a backend that runs on your device to pull images from your camera and post notifications.

### Intro Page

![Intro Page](./images/Groundlight-Docker-Frontpage.png)

### Detector Dashboard

![Detector Dashboard](./images/Groundlight-Detector-Dashboard.png)

## Running the server

There are several ways to deploy the code:

- Using Docker Compose
- Using AWS Greengrass
- Using Kubernetes

### Running with Docker Compose

1. Use the file [`docker-compose.yml`](./deploy/docker-compose.yml) file. 

2. Run `docker-compose up` in the same directory as the `docker-compose.yml` file.

### Running from Docker Compose on 32-bit ARM (armv7)

32-bit arm requires different binary images.

1. Use the slightly different `docker-compose-armv7.yml`.

2. Run `docker-compose -f docker-compose-armv7.yml up`.

### Running with AWS Greengrass

Before creating the component, you must run `sudo usermod -aG docker ggc_user` on your Greengrass device to allow the Greengrass service to access the host's Docker daemon.

1. Create a new Greengrass Component
2. Select "Enter recipe as YAML"
3. Paste the YAML from [greengrass-recipe.yaml](./deploy/greengrass-recipe.yaml) into the text box
4. Click "Create component"
5. Click "Deploy" to deploy the component to your Greengrass group

### Running with Kubernetes

_coming soon_

We recommend a minimal Kubernetes install like [k3s](https://k3s.io/).

## Building from Source

1. Install [Node.js](https://nodejs.org/en/download/) and [Python 3.8+](https://www.python.org/downloads/).

```bash
git clone https://github.com/groundlight/monitoring-notification-server
cd monitoring-notification-server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The FastApi server will be running on [http://0.0.0.0:8000](http://0.0.0.0:8000) – feel free to change the port in `package.json` (you'll also need to update it in `next.config.js`).

## Contributing

We welcome pull requests!

### Organization of source code

- `app` is the frontend TypeScript / React application
- `api` is the backend Python / FastApi application
- `deploy` has code for deploying the system
