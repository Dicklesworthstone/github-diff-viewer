import { createProxyMiddleware } from 'http-proxy-middleware';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const proxy = createProxyMiddleware({
  target: 'https://github.com',
  changeOrigin: true,
  pathRewrite: { '^/api/proxy': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('User-Agent', 'git/2.0.0');
    proxyReq.setHeader('Accept', '*/*');
    if (req.url.includes('git-upload-pack')) {
      proxyReq.setHeader('Content-Type', 'application/x-git-upload-pack-request');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
  logLevel: 'debug',
});

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    proxy(req, res, (result) => {
      if (result instanceof Error) {
        console.error('Proxy error:', result);
        return reject(result);
      }
      return resolve(result);
    });
  });
}