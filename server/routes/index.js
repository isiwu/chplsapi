import express from "express";
import useRouter from "./users";

const router = express.Router();

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
router.post("/chpls", (req, res) => {
  res.json({status: true, data: "chplsapi"})
})
router.use('/users', useRouter);

export default router;
