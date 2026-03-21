const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.post("/add",(req,res)=>{

const {name,message} = req.body;

db.query(
"INSERT INTO feedback (name,message) VALUES (?,?)",
[name,message],
(err,result)=>{

if(err){
console.log(err)
return res.status(500).json({error:"Database error"})
}

res.json({success:true})

})

})

module.exports = router;