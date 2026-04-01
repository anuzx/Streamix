import express from "express";

import cookieParser from "cookie-parser"; //use to access the client cookie and set it ,do CRUD operation

import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,//the origins we are allowing
    Credentials: true,
  })
);

//data can come from varies sources like files,json etc ,so we need to establish middlewares

app.use(express.json({ limit: "16kb" })); //data that we will take from form

//data from url:
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//data from static files (to store files on server)
app.use(express.static("public"));

app.use(cookieParser()); //to access cookies in user browser from server and perform CRUD operation

//ROUTES:

import userRouter from "./routes/user.routes.js"; //this import statement has own name this works only when export is default
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//ROUTES DECLARATION:

//app.get will not be used here becuz we have made router seperatly

app.use("/api/v1/users", userRouter); //control is passed to userRouter
//url will look something like : https://localhost:8000/api/v1/users/route
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };
