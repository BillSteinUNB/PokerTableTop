import { createPokerServer } from "./server.js";
let server;
let stopping;
function stop(exitCode) {
  if (stopping) return stopping;
  // Allow in-flight database writes to finish, but never hang a deployment.
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  stopping = (async () => {
    try {
      await server?.close();
    } finally {
      process.exit(exitCode);
    }
  })();
  return stopping;
}
try {
  server = await createPokerServer({
    onFatal: () => {
      void stop(1);
    },
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const port = Number(process.env.PORT) || 3001;
server.httpServer.listen(port, "0.0.0.0", () =>
  console.log(`Pixel Poker server listening on http://localhost:${port}`),
);
server.httpServer.on("error", (error) => {
  console.error("Cannot start game server:", error.code);
  void stop(1);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void stop(0);
  });
}
