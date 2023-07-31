<p align="center">
  <a href="https://nextjs-fastapi-starter.vercel.app/">
    <img src="https://avatars.githubusercontent.com/u/118213576?s=200&v=4" height="96">
    <h3 align="center">Linux Edgelight Server</h3>
  </a>
</p>

<br/>

## Running from Docker

1. Create the file `docker-compose.yml` with the following contents:

```yaml
services:
  frontend:
    image: docker.io/maxatgroundlight/groundlight-edge-client-frontend:latest
    environment:
      - BACKEND_URL_SUBSTITUTION="http://172.17.0.1:8000/api/:path*"
    ports:
      - "3000:3000"
    depends_on:
      - backend
  backend:
    image: docker.io/maxatgroundlight/groundlight-edge-client-backend:latest
    ports:
      - "8000:8000"
```

2. Run `docker-compose up` in the same directory as the `docker-compose.yml` file.

## Running from Source

```bash
git clone git@github.com:max-at-groundlight/linux-edgelight-server.git
cd linux-edgelight-server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The FastApi server will be running on [http://0.0.0.0:8000](http://0.0.0.0:8000) – feel free to change the port in `package.json` (you'll also need to update it in `next.config.js`).

