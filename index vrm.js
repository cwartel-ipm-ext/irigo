var selfUrl = process.env["SELF_URL"] || "8080--main--ced-ws--ced--ler9018hr1f30.pit-1.try.coder.app";
                                          
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

const proxyConf={ "/": "start.valenceromansmobilites.fr", "/www": "www.valenceromansmobilites.fr", "/boutique": "boutique.valenceromansmobilites.fr"}


for (const [target, origin] of Object.entries(proxyConf)) {
app.use(
  target,
  createProxyMiddleware({
    target: "https://"+origin,
    changeOrigin: true,
    pathFilter: ["!/client/*", "!/pdf/*","!/www/*", "!/boutique/*"],
    selfHandleResponse: true,
    secure: false,
    logger: console,
    on: {
      proxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, res) => {
          
          if (proxyRes.headers["content-type"]?.includes("text/html")) {
            
            
            document = cheerio.load(responseBuffer);
            /*document(
              '<script type="application/javascript" src="/client/skScript.js"></script>',
            ).appendTo("head");
            document(
              '<script type="text/javascript" src="/client/SPA.js" />',
            ).appendTo("head");*/
            
            var response = document.html().toString("utf8");

            var repsonse = parseAndDeleteExternalLinks(response);

            for ( [target2, origin2, ] of Object.entries(proxyConf)) {
              response = response.replaceAll(origin2,selfUrl+target2);
            }
            
            return parseAndDeleteExternalLinks(response);
          }

          if (
            proxyRes.headers["content-type"]?.includes("application/javascript") ||
            proxyRes.headers["content-type"]?.includes("application/x-javascript") ||
            proxyRes.headers["content-type"]?.includes("application/json")
          ) {
            var response = responseBuffer.toString("utf8");

            for ( [target2, origin2, ] of Object.entries(proxyConf)) {
              
              response = response.replaceAll(origin2,selfUrl+target2);
            }
            
            return parseAndDeleteExternalLinks(response);
            
          }
          //leave other resource as is


          return responseBuffer;
        },
      ),
    },
  }),
);
}
var port = process.env["PORT"] || 8081;
app.listen(port, () => {});
