import User from "../models/user";
import Certificate from "../models/certificate";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
// import sendpulse from "sendpulse-api";
import Emailverify from "../models/emailverify";
import sendMails from "../models/email";

// login user_______________
const LoginUser = async (req, res) => {
  const { email, password } = req.body;
  const get_user = await User.findOne({
    email: email,
  });

  try {
    const get_user = await User.findOne({
      email: email,
    });
    if (get_user === null) {
      return res.status(400).json({
        status: false,
        message: "Incorrect user email credentials",
      });
    }

    if (get_user?.verification == false) {
      res
        .status(401)
        .json({ status: false, msg: "User verification is incomplete" });
    }

    const match = await bcrypt.compare(password, get_user.password);

    if (match) {
      //STORE LOGGEDIN USER ID IN THE SESSION
      //req.session.user = get_user.id;

      const certifiedUserDetails = await Certificate.findOne({
        userId: get_user._id,
      });

      if (get_user.certified.CHLPS) {
        const today = new Date();
        const expiration = new Date(certifiedUserDetails?.expiredAt);
        console.log("expire", certifiedUserDetails);
        //compare the expiration date to the current date
        const compare = expiration - today;

        const daysRemaining = compare / (24 * 60 * 60 * 1000);

        if (daysRemaining <= 0) {
          get_user.certified.CHLPS = false;

          await certifiedUserDetails.save();
          await get_user.save();
        }
      }
      if (get_user.certified.CLTA) {
        const today = new Date();
        const expiration = new Date(certifiedUserDetails.expiredAt);

        //compare the expiration date to the current date
        const compare = expiration - today;

        const daysRemaining = compare / (24 * 60 * 60 * 1000);

        if (daysRemaining <= 0) {
          certifiedUserDetails.CLTA.value = false;
          get_user.certified.CLTA = false;

          await certifiedUserDetails.save();
          await get_user.save();
        }
      }

      res.status(200).json({
        status: true,
        data: get_user,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Incorrect user password credentials",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// send email and save verification code ___________________
const sendEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const random_String = Math.floor(Math.random() * 1000000);
  // const random_String = Math.random().toString(36).slice(2);

  try {
    const user = await User.findOne({ _id: id });
    console.log("user => ", user);
    const userCode = await Emailverify.findById({ _id: id });
    console.log(userCode);
    if (!userCode) {
      await Emailverify.create({
        _id: id,
        emailCode: random_String,
      });
    } else {
      userCode._id = id;
      userCode.emailCode = random_String;
      await userCode.save();
    }
    await sendMails(
      email,
      "EMAIL VERIFICATION",
      `${random_String}`,
      `<div style="border-radius:10px;padding:10px ;background-color:grey">
              <p style="text-align:center;color:white">Your CHLPS verification code</p>
              <h1 style="text-align:center;color:white">${random_String}</h1>
             </div>`
    );
    res.status(201).json({
      status: true,
      msg: "Successfully sent email code",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// get all email verification codes ___________________
const getAllEmailCodes = async (req, res) => {
  try {
    const allEmailCodes = await Emailverify.find({});
    res.status(200).json({
      status: true,
      message: "Successfully fetched all email codes",
      data: allEmailCodes,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// verify email code ___________________

const verifyEmailCode = async (req, res) => {
  const { id } = req.params;
  const { emailCode } = req.body;
  try {
    const userCode = await Emailverify.findOne({ _id: id });
    const getUser = await User.findOne({ _id: id });
    if (userCode.emailCode === emailCode) {
      getUser.verification = true;
      await getUser.save();

      res.status(200).json({
        status: true,
        message: "Successfully verified email code",
      });
    } else {
      res.json({
        status: false,
        message: "Incorrect email code",
      });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const validateUser = async (req, res, next) => {
  let currUser;
  if (!req.headers.token) {
    return res.status(401).json({
      status: false,
      data: "token not found.",
    });
  }

  try {
    currUser = await User.findOne({ apiToken: req.headers.token });
  } catch (error) {
    console.log(
      `Error fetching user info in validateUser controller due to: ${error.message}`
    );

    return res.status(500).json({
      status: false,
      data: "Server busy. Try again later.",
    });
  }

  if (!currUser) {
    console.log("User info could not be fetched.");

    return res.status(404).json({
      status: false,
      data: "Server busy. Try again later.",
    });
  }

  //VALIDITY MEMBERSHIPS DETAIL
  if (
    !currUser.membership.licentiate.isMember ||
    !currUser.membership.associate.isMember ||
    !currUser.membership.full.isMember
  )
    return next();

  const currDate = new Date();
  const joinedAt = currUser.membership.licentiate.joinedAt;
  joinedAt.setDate(joinedAt.getDate() + 2);

  if (currUser.membership.licentiate.isMember) {
    if (currDate.getDate() < joinedAt.getDate()) {
      await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.licentiate.hasExpired": true,
        },
      });
    }
  }

  if (currUser.membership.associate.isMember) {
    if (currDate.getDate() < joinedAt.getDate()) {
      await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.associate.hasExpired": true,
        },
      });
    }
  }

  if (currUser.membership.full.isMember) {
    if (currDate.getDate() < joinedAt.getDate()) {
      await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.full.hasExpired": true,
        },
      });
    }
  }

  next();
};

export {
  LoginUser,
  sendEmail,
  getAllEmailCodes,
  verifyEmailCode,
  validateUser,
};
