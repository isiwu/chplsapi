import user from "../models/user.js";
import transaction from "../models/transaction.js";
import certificate from "../models/Certificate.js";

const getAllTransactions = async (req, res) => {
  try {
    const transactionList = await transaction.find({});
    res.status(200).json({ status: true, data: transactionList });
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await transactionfindByIdAndDelete(id);
    if (!transaction) {
      res.status(401).json({ message: "certificate was not found" });
    } else {
      res
        .status(200)
        .json({ status: true, msg: `Transaction with id: ${id} deleted` });
    }
  } catch (err) {
    res.status(500).send({ msg: err.message });
  }
};

const postTransaction = async (req, res) => {
  const { amount, paymentType, transactionId, userId } = req.body;
  if (!amount || !paymentType || !userId || !transactionId)
    return res
      .status(401)
      .json({ status: false, msg: "All fieds are required" });
  try {
    const userDetails = await user.findOne({ _id: userId });
    const newTransaction = await transaction.create({
      paymentType,
      amount,
      transactionId,
      paymentDate: new Date(),
      user: {
        name: userDetails.firstName + " " + userDetails.lastName,
        email: userDetails.email,
      },
    });
    res.status(200).json({ status: true, data: newTransaction });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const dashboardStat = async (req, res) => {
  try {
    const users = await user.find({});
    const transactions = await transaction.find({});
    const certificates = await certificate.find({});
    const members = await user.find({
      $or: [
        { "membership.licentiate.isMember": true },
        { "membership.full.isMember": true },
        { "membership.associate.isMember": true },
        { "membership.corporate.isMember": true },
      ],
    });

    const dashboard = {
      userTotal: users.length,
      certTotal: certificates.length,
      memberTotal: members.length,
      revenue: transactions.reduce((acc, curr) => {
        acc += curr.amount;
        return acc;
      }, 0),
    };

    res.status(200).json({ status: true, data: dashboard });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export {
  deleteTransaction,
  getAllTransactions,
  postTransaction,
  dashboardStat,
};
