const ClientApp = require("./client_app");

const app = new ClientApp();

app.start();

process.on("SIGINT", () => {
  app.printServerRequestsStat();

  process.exit();
});
