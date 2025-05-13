# Welcome to Swiss Mud Proxy

## Prerequisite
- Install [fly.io CLI](https://fly.io/docs/flyctl/)
- Install [Bun](https://bun.sh/docs/installation)

## Repository Setup
```
git clone git@github.com:lonelytango/swiss-mud-proxy.git
```
- Rename your proxy application to a new name, you can change that in `package.json`. Assuming your app's name is `boom-proxy`, update it:
```
// package.json
{
  "name": "boom-proxy",
  ...
}
```

## Local Development

### Install Pacakges
- On root directory
```
bun install
```
### Run app locally
```
bun start
```
You should see
```
WebSocket-to-TCP proxy running on ws://0.0.0.0:3000
```

[Swiss Mud Client](https://github.com/lonelytango/swiss-mud-client) will use `ws://0.0.0.0:3000` as default when run locally if `VITE_WS_URL` is not defined in `.env`.

## Remote Deployment (fly.io)

Please note that the following process will not be applicable if you want to use other web services.

- Login to fly.io in terminal
```
fly auth login
```

- After login you should see:
```
Waiting for session... Done
successfully logged in as <your email>
```

### Deploy your app to fly.io 
- Run deployment script:
```
npm run deploy
```

- After deployment, you will see
```
Visit your newly deployed app at https://boom-proxy.fly.dev/
```
- Now our proxy server is ready to use. Since WebSocket Secure connection is being used, `wss` is used instead of `https`, your WebSocket proxy url is:
```
wss://boom-proxy.fly.dev
```
This should be used in the `.env` in Swiss Mud Client, which we will discussed in detail on client's Read Me.
