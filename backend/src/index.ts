import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB() //it is an async method , and whenever async method is completed a promise is returned
  .then(() => {
    const server = app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at: ${process.env.PORT || 8000}`);
    });

    server.on("error", (error) => {
      console.error("SERVER START FAILED:", error);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("MONGODB connection failed !!!", err);
    process.exit(1);
  });

//server.on gives Port/OS errors (server level failures)
//app.listen() returns a node.js http server object
