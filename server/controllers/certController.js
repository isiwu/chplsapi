import { response } from "express";
import Certificate from "../models/certificate";
import User from "../models/user";
import nodemailer from "nodemailer";
import sendMails from "../models/email";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";

const certApplication = async (req, res) => {
  //console.log(req.body);
  const { userId, transactionId, CHLPS, CLTA, examLocation } = req.body;

  if (!transactionId || !userId)
    return res
      .status(401)
      .json({ status: false, msg: "All fields are required" });

  try {
    const certifiedUser = await User.findOne({ _id: userId });

    const now = new Date();
    now.setFullYear(now.getFullYear() + 2);

    const certified = await Certificate.create({
      userId,
      transactionId,
      examLocation,
      email: certifiedUser.email,
      paymentDate: new Date(),
      certificateType: CHLPS == 1 ? "CHLPS" : "CLTA",
      expiredAt: now,
    });

    await sendMails(
      certifiedUser.email,
      "APPLICATION SUCCESS",
      null,
      ` <div style="border-radius:10px;padding:10px ;background-color:grey;display:flex;justify-content:center;align-center;flex-direction:column">
        <p style="text-align:center;color:white">
          Your application to ${
            CHLPS == 1 ? "CHLPS" : "CLTA"
          } exam certification was successful.
        </p>
        <button style="text-align:center;color:white;background-color:peru;border-radius:10px;padding:4px">
          back to your dashboard
        </button>
      </div>`
    );

    res.status(201).json({ status: true, data: certified });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

const getCertList = async (req, res) => {
  const certList = await Certificate.find({});
  res.status(200).json({ status: true, data: certList });
};

const deleteCert = async (req, res) => {
  const id = req.params.id;
  if (!id) res.status(400).json({ status: false, message: "id is required" });
  try {
    const thecert = await Certificate.findByIdAndDelete(id);
    if (!thecert) {
      res.status(401).json({ message: "certificate was not found" });
    } else {
      res
        .status(200)
        .json({ status: true, msg: `Certificate with id: ${id} deleted` });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

const approveCertificate = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const cert = await Certificate.findOne({ _id: id });

    const user = await User.findOne({ _id: userId });

    if (!cert) {
      res.status(401).json({ status: false, msg: "Invalid ID" });
    } else {
      function makeid(length) {
        var result = "";
        var characters = "0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
          );
        }
        return result;
      }
      const newCertId = makeid(7);

      cert.Approval = 1;
      cert.certNo = newCertId;
      await cert.save();

      //update user property for certificate ownership

      if (cert.certificateType == "CLTA") {
        user.certified.CLTA = true;
        await user.save();
      }

      if (cert.certificateType == "CHLPS") {
        user.certified.CHLPS = true;
        await user.save();
      }

      //generate a certificate
      async function generateCert() {
        //load the certificate template
        const existingPdfBytes = fs.readFileSync("certificate.pdf");
        // const existingPdfBytes = await fetch(url).then((res) =>
        //   res.arrayBuffer()
        // );

        const document = await PDFDocument.load(existingPdfBytes);

        // Embed the Helvetica font
        const fontFamily = await document.embedFont(StandardFonts.Helvetica);

        //on the certificate
        const theCertificate = document.getPage(0);

        const fullName = user.firstName + " " + user.lastName;
        const nameLength = fullName.length;
        //positioning
        const right =
          nameLength > 12 && nameLength < 20 ? 150 : nameLength > 25 ? 0 : 310;
        theCertificate.moveTo(right, 270);

        //write the name of the Cert owner

        theCertificate.drawText(fullName, {
          font: fontFamily,
          size: 50,
          color: rgb(1, 1, 1),
        });

        //write the certificate number

        theCertificate.moveTo(214, 145);
        theCertificate.drawText(newCertId, {
          font: fontFamily,
          size: 15,
          color: rgb(1, 1, 1),
        });
        // validity period
        theCertificate.moveTo(230, 110);
        theCertificate.drawText(
          new Date(cert.expiredAt).toLocaleDateString("en-US"),
          {
            font: fontFamily,
            size: 12,
            color: rgb(1, 1, 0.9),
          }
        );

        fs.writeFileSync(
          `storage/certificates/${user._id + cert.certificateType}.pdf`,
          await document.save()
        );

        const newCertificate = {
          certType: cert.certificateType,
          urlPath: `${req.protocol}://${req.headers.host}/certificates/${
            user._id + cert.certificateType
          }.pdf`,
        };

        user.certificates.push(newCertificate);
        await user.save();
      }
      generateCert().catch((err) => console.log(err));

      res.status(200).json({
        status: true,
        msg: "Certificate approved and issued successfully",
      });

      await sendMails(
        user.email,
        "Exam Certificate ",
        null,
        `<div style="border-radius:10px;padding:10px ;background-color:gray;display:flex;justify-content:center;align-center;flex-direction:column">
        <div>
        <p style="text-align:center;color:black">
        Hello ${user.firstName} <br/><br/>
         Your certificate has been approve and is now available for download.
         Go to your dashoard to download the certificate. Thank You.
        </p>
      </div>
      </div>`
      );
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const verifyCertCode = async (req, res) => {
  const { certCode } = req.body;

  if (!certCode) {
    res.status(400).json({ msg: "Code id required" });
  }

  try {
    const cert = await Certificate.findOne({ certNo: certCode });
    if (!cert)
      res.status(401).json({ status: false, msg: "Invalid certificate code" });

    const userDetails = await User.findOne({ _id: cert.userId });

    if (userDetails) {
      const returningData = {
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        issueDate: cert.paymentDate,
        expiredAt: cert.expiredAt,
        OwnerNationality: userDetails.country,
        avatar: userDetails.avatar,
        certType: cert.certificateType,
      };

      res.status(200).json({ status: true, data: returningData });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const scheduleExam = async (req, res) => {
  const id = req.params.id;
  const { address, time, date } = req.body;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      res.status(400).json({ msg: "User not found" });
    }
    sendMails(
      user.email,
      "Certificate Exam Schedule",
      null,
      `<div style="border-radius:10px;padding:10px;">
        
      <p>  Hello ${user.firstName}</p><br/><br/>
      <div style="display:flex;justify-content:center;align-center;flex-direction:column">

        <p style="text-align:center;color:black">
         Your certification exam has been scheduled on ${date},${time} at ${address}.
         For more details contact our support team support@chlps.com. Thank You.
        </p>
      </div>
      </div>`
    );

    res.status(200).json({ status: true, msg: "Exam scheduled successfully" });
  } catch (err) {
    console.log(err.message);
  }
};

export {
  certApplication,
  getCertList,
  deleteCert,
  approveCertificate,
  verifyCertCode,
  scheduleExam,
};
