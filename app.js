import express from "express";
//import { join } from 'path';
//import cookieParser from 'cookie-parser';
import logger from "morgan";
import cors from "cors";
import session from "express-session";
import mongoose from "mongoose";
import connectMongodbSession from "connect-mongodb-session";
import dotEnv from "dotenv";
import path from "path";
//routes
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/adminroutes.js"
import login from "./routes/auth.js";
import membershipList from "./routes/membershipLists.js";
import certification from "./routes/certification.js";
import transaction from "./routes/transactionpath.js";

dotEnv.config();

const app = express();
const DB_URI =
  "mongodb+srv://inmotion:validprofit@cluster0.wyb6yq6.mongodb.net/chpls_db?retryWrites=true&w=majority";
mongoose
  .connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("database connected");
  })
  .catch((error) => {
    console.log(`database connection error: ${error.message}`);
  });

mongoose.set("returnOriginal", false);

const MongoDBStore = connectMongodbSession(session),
  store = new MongoDBStore(
    {
      uri: DB_URI,
      databaseName: "test",
      collection: "session",
      expires: 1000 * 60 * 60,
      connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    (error) => {
      if (error) console.log(`Session ${error}`);
      else console.log("Session database connected!");
      //console.log(`Error connecting to database for session model: ${error}`);
    }
  );
const sessionOptions = {
  secret: "chplsapi.inmotion",
  cookie: {
    httpOnly: true,
    //secure: true,
    maxAge: 1000 * 20,
    sameSite: "none",
  },
  name: "chplsCookie",
  resave: false,
  saveUninitialized: false,
  store,
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionOptions.cookie.secure = true;
}

const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(express.static("storage"));
app.use(cors(corsOptions));
app.use(session(sessionOptions));
// console.log(import.meta.url)
// console.log(path.dirname(import.meta.url))
//console.log(path.basename(path.dirname(import.meta.url)))
app.use((req, res, next) => {
  req._dirname = path.basename(path.dirname(import.meta.url));

  next();
});
//app.use(cors({ origin: process.env.REMOTE_CLIENT_APP, credentials: true }));
//app.use(session(sessionOptions));

app.use("/api", indexRouter);
app.use("/", login);
app.use("/", membershipList);
app.use("/", certification);
app.use("/", transaction);
app.use("/", usersRouter);
app.use("/", adminRouter);
app.use((req, res) => {
  res.status(404).json({
    status: false,
    data: "Our server is down and your request cannot be filfulled now!",
  });
});
app.use((error, req, res, next) => {
  if (error) {
    res
      .status(500)
      .json({ status: false, data: "Error occured, try again later!" });
  }
});

export default app;