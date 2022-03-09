const https = require("https");
const http = require("http");
const { convertNsToMs, wait } = require("./utils/helpers");
const {
  DATA_PATH,
  SERVER_HOST,
  SERVER_PORT,
  FUNDRAISEUP_URL,
  POST_METHOD,
} = require("./utils/constants");

class ClientApp {
  constructor() {}

  serverRequestsStats = {
    totalRequests: 0,
    ok: 0,
    internalServerError: 0,
    serverHangUp: 0,
  };

  pingCount = 0;

  async start() {
    this.pingCount += 1;

    let responseTime;

    try {
      responseTime = await this.getResponseTime(FUNDRAISEUP_URL);
    } catch (e) {
      throw new Error(e);
    }

    const pingAt = Date.now();

    const responseTimeStat = {
      pingId: this.pingCount,
      date: pingAt,
      responseTime,
    };

    await this.sendResponseTimeWithExponentialBackoff(responseTimeStat);

    await wait(1000);

    return await this.start();
  }

  getResponseTime(url) {
    return new Promise((resolve, reject) => {
      const reqStartAt = process.hrtime.bigint();

      https.get(url, (res) => {
        const { statusCode } = res;

        if (statusCode !== 200) {
          res.resume();

          const errMsg = `Request to ${url} failed with Status Code ${statusCode}`;

          return reject(new Error(errMsg));
        }

        res.on("data", () => res.resume());

        res.on("end", () => {
          const reqEndAt = process.hrtime.bigint();

          const responseTimeInNs = reqEndAt - reqStartAt;

          resolve(convertNsToMs(responseTimeInNs));
        });
      });
    });
  }

  postResponseTimeData(data) {
    const jsonData = JSON.stringify(data);

    const options = {
      host: SERVER_HOST,
      port: SERVER_PORT,
      path: DATA_PATH,
      method: POST_METHOD,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(jsonData),
      },
    };

    return new Promise((resolve, reject) => {
      this.serverRequestsStats.totalRequests += 1;

      const req = http.request(options, (res) => {
        const { statusCode } = res;

        if (statusCode === 500) {
          this.serverRequestsStats.internalServerError += 1;

          console.log("Server responded with Status Code 500");

          reject();
        }

        res.on("data", () => res.resume());

        res.on("end", () => {
          if (statusCode === 200) {
            this.serverRequestsStats.ok += 1;

            console.log("Server responded with Status Code 200");

            resolve();
          }
        });
      });

      req.on("error", () => reject());

      req.setTimeout(10000, () => {
        this.serverRequestsStats.serverHangUp += 1;

        console.log("Server Timed Out");

        req.destroy();
      });

      req.write(jsonData);
      req.end();
    });
  }

  async sendResponseTimeWithExponentialBackoff(
    responseTimeStat,
    retryCount = 0
  ) {
    const deliveryAttempt = retryCount + 1;

    const data = {
      ...responseTimeStat,
      deliveryAttempt,
    };

    if (deliveryAttempt < 2) {
      console.log("----------------------------");
    }

    console.log(
      `Sending ping №${data.pingId} to server. Attempt №${deliveryAttempt}`
    );

    try {
      await this.postResponseTimeData(data);
    } catch (err) {
      await wait(2 ** retryCount * 10);

      return await this.sendResponseTimeWithExponentialBackoff(
        data,
        retryCount + 1
      );
    }
  }

  printServerRequestsStat() {
    const { totalRequests, ok, internalServerError, serverHangUp } =
      this.serverRequestsStats;

    console.log(`\nTotal Requests Count: ${totalRequests}`);
    console.log(`Successfull Requests Count: ${ok}`);
    console.log(`500 Staus Code Requests Count: ${internalServerError}`);
    console.log(`Hang Up Requests Count: ${serverHangUp}`);
  }
}

module.exports = ClientApp;
