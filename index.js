var selfUrl = process.env["SELF_URL"] || "https://8080--main--ced-ws--ced--ler9018hr1f30.pit-1.try.coder.app/";
//var proxiedFQDN = "borne-irigo.dataccessor.com/";
var proxiedFQDN = "borne.irigo.fr/";

const cheerio = require("cheerio");
const express = require("express");
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware");

const app = express();

function parseAndDeleteExternalLinks(html) {
  return html
    .toString("utf8")
    .replaceAll("https://leafletjs.com", "")
    .replaceAll("https://latitude-cartagene.com", "")
    .replaceAll("https://www.openstreetmap.org/copyright", "")
    .replaceAll("https://www.irigo.fr", "");
}

app.use("/client", express.static("client"));

app.use(
  "/pdf",
  createProxyMiddleware({
    target: "parseAndDeleteExternalLinks",
    changeOrigin: true,
    selfHandleResponse: true,
    secure: false,
    logger: console,
    on: {
      proxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, res) => {
          return responseBuffer;
        },
      ),
    },
  }),
);

app.use(
  "/",
  createProxyMiddleware({
    target: "https://"+proxiedFQDN,
    changeOrigin: true,
    pathFilter: ["!/client/*", "!/pdf/*"],
    selfHandleResponse: true,
    secure: false,
    logger: console,
    on: {
      proxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, res) => {
          console.log(req.path);

          if (proxyRes.headers["content-type"]?.includes("text/html")) {
            document = cheerio.load(responseBuffer);
            document(
              //'<script type="text/javascript" src="https://6q2zmj.csb.app/src/index2.js" />',
              '<script type="application/javascript" src="/client/skScript.js"></script>',
            ).appendTo("head");
            document(
              //'<script type="text/javascript" src="https://6q2zmj.csb.app/src/index2.js" />',
              '<script type="text/javascript" src="/client/SPA.js" />',
            ).appendTo("head");

            const response = document.html();
            //turn absolute links to relative ones
            return response
              .replaceAll("https://"+proxiedFQDN, selfUrl)
              .replaceAll("http://"+proxiedFQDN, selfUrl);
          }

          if (
            proxyRes.headers["content-type"]?.includes("text/html") ||
            proxyRes.headers["content-type"]?.includes("application/javascript")
          ) {
            return responseBuffer
              .toString("utf8")
              .replaceAll("https://"+proxiedFQDN, selfUrl)
              .replaceAll("http://"+proxiedFQDN, selfUrl);
          }
          //leave other resource as is
          return responseBuffer;
        },
      ),
    },
  }),
);

var port = process.env["PORT"] || 8080;
app.listen(port, () => {});
