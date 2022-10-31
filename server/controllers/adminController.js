import Admin from "../models/admin";
import bcrypt from "bcrypt";

const createAdmin = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    if (!firstName || !lastName || !email || !password || !role) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }
    const pass = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password: pass,
      role,
    });

    res.status(201).json({ status: true, data: admin });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ status: false, msg: "All fields are required" });
    }
    const admin = await Admin.findOne({ email });

    if (admin === null) {
      return res.status(404).json({ status: false, msg: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, msg: "Invalid email or password" });
    }

    if (role !== admin.role) {
      return res.status(400).json({ status: false, msg: "Invalid role" });
    }

    return res
      .status(200)
      .json({ status: true, msg: "Login successful", data: admin });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const delete_admin = await Admin.findByIdAndDelete({ _id: id });

    if (delete_admin === null) {
      return res.status(404).json({ status: false, msg: "admin not found" });
    }
    return res
      .status(200)
      .json({ status: true, msg: "admin successfully deleted" });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ status: true, data: admins });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
};

export { deleteAdmin, createAdmin, loginAdmin, getAllAdmins };
