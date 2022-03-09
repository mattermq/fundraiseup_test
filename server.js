const http = require("http");
const { calcMean, calcMedian } = require("./utils/helpers");
const { SERVER_PORT, DATA_PATH, POST_METHOD } = require("./utils/constants");

const responseTimes = [];

http
  .createServer((req, res) => {
    const { method, url } = req;

    if (method === POST_METHOD && url === DATA_PATH) {
      const randomPercent = Math.trunc(Math.random() * 100);

      if (randomPercent < 60) {
        let rawData = "";

        req.on("data", (chunk) => (rawData += chunk.toString()));

        req.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);

            responseTimes.push(parsedData.responseTime);

            console.log(parsedData);

            return res.end("OK");
          } catch (e) {
            console.error(e.message);

            res.statusCode = 500;

            return res.end();
          }
        });
      }

      if (randomPercent >= 60 && randomPercent < 80) {
        res.statusCode = 500;

        return res.end();
      }

      if (randomPercent >= 80) {
        return;
      }
    }
  })
  .listen(SERVER_PORT);

process.on("SIGINT", () => {
  if (responseTimes.length > 0) {
    printResponseTimesStat(responseTimes)
  }

  process.exit();
});

function printResponseTimesStat(responseTimes) {
  const mean = calcMean(responseTimes);
  const median = calcMedian(responseTimes);

  console.log(`\nMean Response Time: ${mean}`);
  console.log(`Median Response Time: ${median}`);
}
