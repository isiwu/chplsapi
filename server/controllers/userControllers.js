import path from "path";
import User from "../models/user";
import bcrypt from "bcrypt";
import randToken from "rand-token";
// import nodemailer from "nodemailer";
import sendMails from "../models/email";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
//import Licentiate from "../models/memberships/licentiate.js";
//import Transaction from "../models/transaction.js";

const createNewUser = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    country,
    state,
    address,
  } = req.body;

  //if the fields are empty
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !phone ||
    !country ||
    !state ||
    !address
  )
    res.status(401).json({ msg: "All fields are rquired" });

  //if user already exists

  let userExist;

  try {
    userExist = await User.findOne({ email: email });
  } catch (error) {
    return next(error);
  }

  if (userExist) res.status(400).json({ msg: "User already exists" });

  try {
    //hash password(encryption of password)
    const hashedpassword = await bcrypt.hash(password, 10);

    let token;

    while (true) {
      token = randToken.generate(16);
      const tokenExist = await User.exists({ apiToken: token });
      if (!tokenExist) break;
    }

    const newPerson = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedpassword,
      phone: phone,
      country: country,
      state: state,
      address: address,
      apiToken: token,
    });

    await sendMails(
      email,
      "WELCOME TO CHLPS",
      null,
      `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-items:center;flex-direction:column">
              <p style="text-align:center;color:white">Your CHLPS registration was successful😊</p>
              <button style="text-align:center;color:white;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
             </div>`
    );
    //send the new user to the client
    res.status(201).json({ status: true, user: newPerson });
  } catch (err) {
    console.log(err.message);
    return next(err);
  }
};

//update user activation status

const updateUserActivationStatus = async (req, res, next) => {
  const { id } = req.params;
  const { active } = req.body;
  let user;

  try {
    user = await User.findById(id);
    if (user === null)
      res.status(404).json({ status: false, msg: "User not found." });
    user.active = active;
    await user.save();
    res.status(200).json({ status: true, data: user });
  } catch (error) {
    console.log(`Error updating user due to: ${error.message}`);
    return next(error);
  }
};
//check if email is already in use

const CheckEmail = async (req, res, next) => {
  const { email } = req.body;
  if (!email) res.status(403).json({ status: false, msg: "Email required" });
  let userExist;

  try {
    userExist = await User.findOne({ email: email });
  } catch (error) {
    return next(error);
  }

  let status, msg;
  if (userExist) {
    status = false;
    msg = "User already exists";
    //res.status(200).json({ status: false, msg: "User already exists" });
  } else {
    status = true;
    msg = "welcome oga";

    //res.status(200).json({ status: true, msg: "welcome oga" });
  }

  return res.status(200).json({status, msg});
};

//VALIDITY MEMBERSHIPS DETAIL
const validateUser = async (currUser) => {
  if (
    !currUser.membership.licentiate.isMember &&
    !currUser.membership.associate.isMember &&
    !currUser.membership.full.isMember
  )
    return currUser;

  const currDate = new Date();
  
  if (currUser.membership.licentiate.isMember && !currUser.membership.licentiate.hasExpired) {
    const approvedAt = currUser.membership.licentiate.approvedAt;
    approvedAt.setHours(approvedAt.getHours() + 1);

    if (currDate.getHours() >= approvedAt.getHours()) {
      currUser = await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.licentiate.hasExpired": true,
        },
      });
    }
  }

  if (currUser.membership.associate.isMember && !currUser.membership.associate.hasExpired) {
    const approvedAt = currUser.membership.associate.approvedAt;
    approvedAt.setHours(approvedAt.getHours() + 1);

    if (currDate.getHours() >= approvedAt.getHours()) {
      currUser = await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.associate.hasExpired": true,
        },
      });
    }
  }

  if (currUser.membership.full.isMember && !currUser.membership.full.hasExpired) {
    const approvedAt = currUser.membership.full.approvedAt;
    approvedAt.setFullYear(approvedAt.getFullYear() + 1);

    if (currDate.getFullYear() > approvedAt.getFullYear()) {
      currUser = await User.findByIdAndUpdate(currUser.id, {
        $set: {
          "membership.full.hasExpired": true,
        },
      });
    }
  }

  return currUser;
}

// get users
const getUsers = async (req, res, next) => {
  let users, mappedUsers;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    console.log(`Error fetcing users due to: ${error.message}`);
    return next(error);
  }

  try {
    mappedUsers = await Promise.all(users?.map(async (user) => await validateUser(user)));
  } catch (error) {
    console.log(`Error resolving mappedUsers' promises due to: ${error.message}`);
    return next(error);
  }

  res.status(200).json({ status: true, data: mappedUsers });
};

//get user
const getUser = async (req, res, next) => {
  const { id } = req.params;
  let user;

  try {
    user = await User.findById(id, "-password");
  } catch (error) {
    console.log(`Error fetching by id due to: ${error.message}`);
    return next(error);
  }

  try {
    user = await validateUser(user)
  } catch (error) {
    console.log(`Error validating status of the user due to: ${error.message}`);
    return next(error);
  }
  res.status(200).json({ status: true, data: user });
};

//get list of members
const getMemberList = async (req, res, next) => {
  let memberList;

  try {
    memberList = await User.findOne({ member: true });
  } catch (error) {
    return next(error);
  }

  res.status(200).json({ status: true, data: memberList });
};
//get list of certified members
const getCertifiedMemberList = async (req, res) => {
  let memberList;

  try {
    memberList = await User.findOne({ certified: true });
  } catch (error) {
    return next(error);
  }

  res.status(200).json({ status: true, data: memberList });
};

//update user profile

const updateUserProfile = async (req, res, next) => {
  const id = req.params.id;
  const {
    title,
    address,
    state,
    organization,
    speciality,
    firstName,
    lastName,
  } = req.body;
  const avatar = req.avatar;
  // console.log(req.file);
  if (!id) res.status(400).json({ status: false, message: "id is required" });

  let userUpdate;

  try {
    userUpdate = await User.findOne({ _id: id });
  } catch (error) {
    return next(error);
  }
  if (!userUpdate)
    res.status(404).json({ status: false, message: "User not found" });

  try {
    // const userUpdate = await User.findOne({ id: id });
    if (!userUpdate)
      res.status(404).json({ status: false, message: "User not found" });

    title !== undefined && title !== null ? (userUpdate.title = title) : null;
    address !== undefined && address !== null
      ? (userUpdate.address = address)
      : null;

    organization !== undefined && organization !== null
      ? (userUpdate.organization = organization)
      : null;
    state !== undefined && state !== null ? (userUpdate.state = state) : null;

    speciality !== undefined && speciality !== null
      ? (userUpdate.speciality = speciality)
      : null;
    avatar !== undefined && avatar !== null
      ? (userUpdate.avatar = avatar)
      : null;
    firstName !== undefined && firstName !== null
      ? (userUpdate.firstName = firstName)
      : null;
    lastName !== undefined && lastName !== null
      ? (userUpdate.lastName = lastName)
      : null;

    const updatedUser = await userUpdate.save();
    res.status(200).json({ status: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};

//password update

const updatePassword = async (req, res, next) => {
  const id = req.params.id;
  if (!id) res.status(400).json({ status: false, message: "id is required" });
  const { password } = req.body;
  try {
    const theUser = await User.findOne({ id: id });

    // const match = await bcrypt.compare(password, theUser.password);
    const hashedpassword = await bcrypt.hash(password, 10);

    if (theUser) {
      theUser.password = hashedpassword;
      const updatePassword = await theUser.save();
      res
        .status(200)
        .json({ status: true, msg: "password updated successfully" });
    } else {
      res.status(400).json({ status: false, msg: "user doesn't exist" });
    }
  } catch (err) {
    next(err);
  }
};

//onblur check of password
const checkPassword = async (req, res, next) => {
  const { id, password } = req.body;
  if (!id || !password)
    res
      .status(400)
      .json({ status: false, message: "All fields are required " });

  try {
    const user = await User.findOne({ id: id });
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.status(200).json({ status: true, message: "Password match" });
    } else {
      res
        .status(200)
        .json({ status: false, message: "Password doesn't match" });
    }
  } catch (err) {
    next(err);
  }
};

//Create membership IDs
const generateId = async (length, userId, memberType) => {
  let randUni;

  while (true) {
    randUni = Math.floor(Math.random() * Date.now()).toString();
    if (randUni.length >= length) break;
  }

  const uniqueId = Number(randUni.slice(0, length));

  //Check if a user is already given the ID
  const user = await User.findOne({ _id: userId });
  if (user && user.membership[memberType] === uniqueId)
    generateId(length, userId, memberType);
  else return uniqueId;
};

// Join Licentiate Membership
const joinLicentate = async (req, res, next) => {
  const { BSG, IC, IQ, transactionId, paidAt } = req.body;
  const userId = req.params.id;

  if (!BSG || !IC || !IQ || !userId || !transactionId) {
    return res.status(400).json({ status: false, message: "Incorrect input" });
  }

  //Does membership already exist
  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    console.log(`Error fetching current user by id due to: ${error.message}`);
    return next(error);
  }
  if (user.membership.licentiate.isMember)
    return res.status(404).json({ status: false, data: "" });

  //const membershipId = await generateId(11, userId, "licentiate");

  //Update user membership
  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        "membership.licentiate.transactionId": transactionId,
        "membership.licentiate.appliedAt": new Date(paidAt),
      },
    });
  } catch (error) {
    console.log(
      `Unable to update the membership status of the user due to: ${error.message}`
    );

    return next(error);
  }
  await sendMails(
    user?.email,
    "LICENCIATE MEMBERSHIP APPLICATION",
    null,
    `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
      <p style="text-align:center;">Your ChLPS Licenciate Membership application has been recieved😊. Please await approval.</p>
      <button style="text-align:center;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
    </div>`
  );
  res.status(200).json({
    status: true,
    message: "Licentiate Membership application submitted sucessfully.",
  });
};
const joinAssociate = async (req, res, next) => {
  const { IQ, IC, levelExp, transactionId, paidAt } = req.body;
  const userId = req.params.id;

  //if (!userId) return res.status(400).json({status: false, data: "server busy. try again."});
  if (levelExp && Number(levelExp) <= 0)
    return res.status(400).json({
      status: false,
      data: "Not elligible for this membership",
    });
  if (!IQ || !IC || !userId || !transactionId)
    return res.status(400).json({
      status: false,
      data: "server busy. try again.",
    });

  //const membershipId = await generateId(11, userId, "associate");
  let user;
  try {
    user = await User.findById(userId);
    await User.findByIdAndUpdate(userId, {
      $set: {
        "membership.associate.transactionId": transactionId,
        "membership.associate.appliedAt": new Date(paidAt),
      },
    });
  } catch (error) {
    console.log(
      `Unable to update the membership status of the user due to: ${error.message}`
    );
    return next(error);
  }
  await sendMails(
    user?.email,
    "ASSOCIATE MEMBERSHIP APPLICATION",
    null,
    `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
      <p style="text-align:center;">Your ChLPS Associate Membership application has been recieved😊. Please await approval.</p>
      <button style="text-align:center;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
    </div>`
  );
  res.status(200).json({
    status: true,
    message: "Associate Membership application submitted sucessfully.",
  });
};
const joinFull = async (req, res, next) => {
  const userId = req.params.id;
  const { PC, levelExp, transactionId, paidAt } = req.body;

  if (!userId || !PC || !transactionId) {
    return res.status(400).json({
      status: false,
      data: "User id or professional certificate required",
    });
  }

  if (!levelExp || Number(levelExp) <= 2) {
    return res.status(400).json({
      status: false,
      data: "Not elligible to join this membership.",
    });
  }

  //const membershipId = await generateId(11, userId, "full");
  let user;
  try {
    user = await User.findById(userId);
    await User.findByIdAndUpdate(userId, {
      $set: {
        "membership.full.transactionId": transactionId,
        "membership.full.appliedAt": new Date(paidAt),
      },
    });
  } catch (error) {
    console.log(
      `Unable to update the membership status of the user due to: ${error.message}`
    );
    return next(error);
  }

  await sendMails(
    user?.email,
    "FULL MEMBERSHIP APPLICATION",
    null,
    `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
      <p style="text-align:center;">Your ChLPS Full Membership application has been recieved😊. Please await approval.</p>
      <button style="text-align:center;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
    </div>`
  );

  res.status(200).json({
    status: true,
    message: "Full Membership application submitted sucessfully.",
  });
};
const joinCorporate = async (req, res, next) => {
  const userId = req.params.id;
  let user;
  try {
    user = await User.findByIdAndUpdate(userId, {
      $set: {
        "membership.corporate.applieddAt": Date.now(),
      },
    });
  } catch (error) {
    console.log(
      `Unable to update the membership status of the user due to: ${error.message}`
    );
    return next(error);
  }

  await sendMails(
    user?.email,
    "CORPERATE VERIFIED",
    null,
    `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
              <p style="text-align:center;">Your CHLPS Corporate membership was successful😊</p>
              <button style="text-align:center;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
             </div>`
  );
  res.status(200).json({
    status: true,
    message: "User joined corporate membership successfully.",
  });
};

const approveMembership = async (req, res, next) => {
  const { id, membership } = req.params;
  let user, membershipId, mailTitle, membershipType, cardPath, resMessage;

  if (!id || !membership)
    return res
      .status(400)
      .json({ status: false, data: "Incorrect incredentials" });

  //generate membership card
  async function generateMembershipCard(userId, membershipId, type) {
    let user, memberTitle,
    months = ["January","Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    period = {
      1: "st",
      2: "nd",
      3: "rd",
      4: "th",
      5: "th",
      6: "th",
      7: "th",
      8: "th",
      9: "th",
      10: "th",
      11: "th",
      12: "th",
      13: "th",
      14: "th",
      15: "th",
      16: "th",
      17: "th",
      18: "th",
      19: "th",
      20: "th",
      21: "st",
      22: "nd",
      23: "rd",
      24: "th",
      25: "th",
      26: "th",
      27: "th",
      28: "th",
      29: "th",
      30: "th",
      31: "th",
    };

    try {
      user = await User.findById(userId);
    } catch (error) {
      console.log(`Error fetching user for membership card creation due to: ${error.message}`);
      return next(error);
    }

    switch (type) {
      case "licentiate":
        memberTitle = "LICENTIATE MEMBER";
        break;
      case "associate":
        memberTitle = "ASSOCIATE MEMBER";
        break;
      case "full":
        memberTitle = "FULL MEMBER";
        break;
      default:
        break;
    }
    //load the certificate template
    const existingPdfBytes = fs.readFileSync("membershipcard.pdf");
    let document;

    try {
      document = await PDFDocument.load(existingPdfBytes);
    } catch (error) {
      console.log(`Error loading document due to: ${error.message}`);
      return next(error);
    }

    // Embed the Helvetica font
    let fontFamily;

    try {
      fontFamily = await document.embedFont(StandardFonts.Helvetica);
    } catch (error) {
      console.log(`Error getting the font-family due to: ${error.message}`);
      return next(error);
    }

    //on the membership card
    const membershipCard = document.getPage(0);

    const fullName = user.firstName + " " + user.lastName;
    const nameLength = fullName.length;
    //positioning
    const right =
      nameLength > 12 && nameLength < 20 ? 150 : nameLength > 25 ? 0 : 310;
    membershipCard.moveTo(right, 372);

    //write the name of the member
    membershipCard.drawText(fullName, {
      font: fontFamily,
      size: 50,
      color: rgb(0, 0, 0.4),
    });
    
    //write the membership title
    membershipCard.moveTo(349, 270);
    membershipCard.drawText(memberTitle, {
      font: fontFamily,
      size: 15,
      color: rgb(0, 0, 0.4),
    });

    //write the membership number
    membershipCard.moveTo(470, 259);
    membershipCard.drawText(`${membershipId}`, {
      font: fontFamily,
      size: 12,
      color: rgb(0, 0, 0.4),
    });

    
    // date
    const issuedAt = new Date();
    let date = issuedAt.getDate();
    let month = issuedAt.getMonth(); 

    date = `${date}${period[date]}`;
    month = months[month];
  
    membershipCard.moveTo(300, 160);
    membershipCard.drawText(`On this ${date} day of ${month}, ${issuedAt.getFullYear()}`,
      {
        font: fontFamily,
        size: 14,
        color: rgb(0, 0, 0.4),
      }
    );

    fs.writeFileSync(
      `storage/membership-cards/${user._id}-${type}.pdf`,
      await document.save()
    );

    const cardUrl = `${req.protocol}://${req.headers.host}/membership-cards/${user._id }-${type}.pdf`;

    return cardUrl;
  }
  //generateMembershipCard().catch((err) => console.log(err));

  // res.status(200).json({
  //   status: true,
  //   msg: "Certificate approved and issued successfully",
  // });

  switch (membership) {
    case "licentiate":
      mailTitle = "LICENTIATE MEMBERSHIP APPLICATION APPROVED.";
      membershipType = "licentiate membership";
      resMessage = "licentiate membership approval successful";
      membershipId = await generateId(7, id, "licentiate");
      cardPath = await generateMembershipCard(id, membershipId, "licentiate");

      //Update user membership
      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.licentiate.isMember": true,
            "membership.licentiate.isApproved": true,
            "membership.licentiate.approvedAt": new Date(),
            "membership.licentiate.id": membershipId,
            "membership.licentiate.card": cardPath,
          },
        });
      } catch (error) {
        console.log(
          `Error approving user licentiate membership apllication due to: ${error.message}`
        );
        return next(error);
      }
      break;
    case "associate":
      mailTitle = "ASSOCIATE MEMBERSHIP APPLICATION APPROVED.";
      membershipType = "associate membership";
      resMessage = "licentiate membership approval successful";
      membershipId = await generateId(11, id, "associate");

      //Update user membership
      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.associate.isMember": true,
            "membership.associate.isApproved": true,
            "membership.associate.approvedAt": new Date(),
            "membership.associate.id": membershipId,
            "membership.associate.card": cardPath,
          },
        });
      } catch (error) {
        console.log(
          `Error approving user associate membership apllication due to: ${error.message}`
        );
        return next(error);
      }
      break;
    case "full":
      mailTitle = "FULL MEMBERSHIP APPLICATION APPROVED.";
      membershipType = "full membership";
      resMessage = "licentiate membership approval successful";
      membershipId = await generateId(11, id, "full");

      //Update user membership
      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.full.isMember": true,
            "membership.full.isApproved": true,
            "membership.full.approvedAt": new Date(),
            "membership.full.id": membershipId,
            "membership.full.card": cardPath,
          },
        });
      } catch (error) {
        console.log(
          `Error approving user full membership apllication due to: ${error.message}`
        );
        return next(error);
      }
      break;
  }

  try {
    await sendMails(
      user?.email,
      mailTitle,
      null,
      `<div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
                <p style="text-align:center;">Congrats!. Your CHLPS ${membershipType} application has been approved😊</p>
                <button style="text-align:center;background-color:peru;border-radius:10px;padding:4px">back to your dashboard</button>
              </div>`
    );
  } catch (error) {
    console.log(`Error sending mail to user due to: ${error.message}`);
  }

  user.timeline.memberships.push({type: membershipType, approvedAt: new Date(), expireAt: new Date().setFullYear(new Date().getFullYear + 2)});
  await user.save();

  res.status(200).json({
    status: true,
    message: resMessage,
  });
};

const renewMembership = async (req, res, next) => {
  const { id, membership } = req.params;
  const { renewedAt } = req.body;
  let user;

  switch (membership) {
    case "licentiate":
      try {
        user = await User.findById(id);

        if (!user.membership.licentiate.hasExpired)
          return res.status(400).json({
            status: false,
            data: "Incorrect data",
          });
      } catch {
        console.log(
          `Error fetching the renewing user data due to: ${error.message}`
        );
        return next(error);
      }

      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.licentiate.hasExpired": false,
            "membership.licentiate.renewedAt": new Date(renewedAt)
          }
        });
      } catch (error) {
        console.log(
          `Error renewing user licentiate membership due to: ${error.message}`
        );
        return next(error);
      }
      break;
    case "associate":
      try {
        user = await User.findById(id);

        if (!user.membership.associate.hasExpired)
          return res.status(400).json({
            status: false,
            data: "Incorrect data",
          });
      } catch {
        console.log(
          `Error fetching the renewing user data due to: ${error.message}`
        );
        return next(error);
      }

      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.associate.hasExpired": false,
            "membership.associate.renewedAt": new Date(renewedAt),
          },
        });
      } catch (error) {
        console.log(
          `Error renewing user associate membership due to: ${error.message}`
        );
        return next(error);
      }
      break;
    case "full":
      try {
        user = await User.findById(id);

        if (!user.membership.full.hasExpired)
          return res.status(400).json({
            status: false,
            data: "Incorrect data",
          });
      } catch {
        console.log(
          `Error fetching the renewing user data due to: ${error.message}`
        );
        return next(error);
      }

      try {
        user = await User.findByIdAndUpdate(id, {
          $set: {
            "membership.full.hasExpired": false,
            "membership.full.renewedAt": new Date(renewedAt),
          },
        });
      } catch (error) {
        console.log(
          `Error renewing user full membership due to: ${error.message}`
        );
        return next(error);
      }
      break;
  }

  res.status(200).json({
    status: true,
    data: [],
  });
};

export {
  CheckEmail,
  createNewUser,
  getUser,
  getUsers,
  getMemberList,
  getCertifiedMemberList,
  updatePassword,
  updateUserProfile,
  checkPassword,
  joinLicentate,
  joinAssociate,
  joinFull,
  joinCorporate,
  updateUserActivationStatus,
  approveMembership,
  renewMembership,
};
