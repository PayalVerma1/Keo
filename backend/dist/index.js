import { app } from "./app.js";
import { createServer } from "http";
import { initSocketServer } from "./modules/websocket/socket.server.js";
const port = process.env.PORT || 3000;
const server = createServer(app);
initSocketServer(server);
server.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
