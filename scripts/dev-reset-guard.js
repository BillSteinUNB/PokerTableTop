// A development connection may reset while Node restarts the backend on Windows.
export function guardDevelopmentConnections(server) {
  server?.on("connection", (socket) => {
    socket.on("error", (error) => {
      if (error.code !== "ECONNRESET" && error.code !== "EPIPE")
        console.error("Development connection error:", error.message);
      socket.destroy();
    });
  });
}
