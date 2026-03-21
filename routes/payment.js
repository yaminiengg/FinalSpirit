const express = require("express")
const router = express.Router()

const Razorpay = require("razorpay")

const db = require("../config/db")

const crypto = require("crypto")

require("dotenv").config()

const razorpay = new Razorpay({

key_id: process.env.RAZORPAY_KEY_ID,

key_secret: process.env.RAZORPAY_KEY_SECRET

})

router.post("/create-order", async (req,res)=>{

const {noteId,price}=req.body

const options={
amount:price*100,
currency:"INR",
receipt:"note_"+noteId
}

try{
const order=await razorpay.orders.create(options)
res.json(order)
}catch(err){
console.log(err)
res.status(500).send("error")
}

})

/*
router.post("/verify",(req,res)=>{

const {userId,noteId,paymentId}=req.body

if(!userId || !noteId || !paymentId){
return res.status(400).send("Missing data")
}

const sql=`
INSERT INTO payments(user_id,note_id,payment_id,status)
VALUES(?,?,?,"success")
`

db.query(sql,[userId,noteId,paymentId],(err)=>{

if(err){
console.log(err)
return res.status(500).send("DB error")
}

res.json({status:"success"})

})

})
*/


const authMiddleware = require("../middleware/authMiddleware")

router.post("/verify", authMiddleware, (req,res)=>{

const userId = req.user.id   // ✅ TAKE FROM TOKEN
const {noteId,paymentId}=req.body

if(!noteId || !paymentId){
return res.status(400).send("Missing data")
}

const sql=`
INSERT INTO payments(user_id,note_id,payment_id,status)
VALUES(?,?,?,"success")
`

db.query(sql,[userId,noteId,paymentId],(err)=>{

if(err){
console.log(err)
return res.status(500).send("DB error")
}

res.json({status:"success"})

})

})


/*
router.post("/check",(req,res)=>{

const {userId,noteId}=req.body

const sql=`
SELECT * FROM payments
WHERE user_id=? AND note_id=? AND status='success'
`

db.query(sql,[userId,noteId],(err,result)=>{

if(result.length>0){
res.json({access:true})
}else{
res.json({access:false})
}

})

})
*/


router.post("/check", authMiddleware, (req,res)=>{

const userId = req.user.id   // ✅ FIX
const {noteId}=req.body

const sql=`
SELECT * FROM payments
WHERE user_id=? AND note_id=? AND status='success'
`

db.query(sql,[userId,noteId],(err,result)=>{

if(result.length>0){
res.json({access:true})
}else{
res.json({access:false})
}

})

})



module.exports=router