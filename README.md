<p align="center">
  <a href="https://nextjs-fastapi-starter.vercel.app/">
    <img src="https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" height="96">
    <h3 align="center">Groundlight Deployable Server</h3>
  </a>
</p>

<!-- <p align="center">Simple Groundlight Deployable Server</p> -->

<br/>

## Running from Docker

```bash
docker run -p 3000:3000 -p 8000:8000 maxatgroundlight/groundlight-multipurpose-img:latest
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The FastApi server will be running on [http://0.0.0.0:8000](http://0.0.0.0:8000) – feel free to change the port in `package.json` (you'll also need to update it in `next.config.js`).

