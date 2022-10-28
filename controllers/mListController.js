import membershipLists from "../models/membershipLists.js";

const addMembership = async (req, res) => {
  const { membershipName, membershipPrice } = req.body;

  try {
    if (!membershipName || !membershipPrice) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }
    const newMembership = await membershipLists.create({
      membershipName: membershipName,
      membershipPrice: membershipPrice,
    });
    res.status(201).json({ status: true, data: newMembership });
  } catch (error) {
    res.status(500).send(error);
  }
};

const getMembership = async (req, res) => {
  // res.status(200).json({ msg: "ijdj" });
  try {
    const membership = await membershipLists.find({});
    console.log(membership);
    if (!membership) {
      return res
        .status(404)
        .json({ status: false, message: "membership not found" });
    } else {
      res.status(200).json({ status: true, data: membership });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateMembership = async (req, res) => {
  const { membershipName, membershipPrice } = req.body;
  const { id } = req.params;
  if (!id) res.status(400).json({ status: false, message: "id is required" });
  try {
    const membership = await membershipLists.findById(id);
    if (!membership) {
      return res
        .status(404)
        .json({ status: false, message: "membership not found" });
    }
    membership.membershipName = membershipName;
    membership.membershipPrice = membershipPrice;
    const updatedMembership = await membership.save();
    res.status(200).json({ status: true, data: updatedMembership });
  } catch (error) {
    res.status(500).send(error);
  }
};

export { addMembership, getMembership, updateMembership };
// export { getMembership };
