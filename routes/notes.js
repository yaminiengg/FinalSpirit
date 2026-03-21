const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");

const authMiddleware = require("../middleware/authMiddleware")

/* Storage configuration */

/*
router.get("/access/:userId/:noteId",(req,res)=>{

const { userId, noteId } = req.params

const sql = `
SELECT * FROM payments
WHERE user_id=? AND note_id=? AND status='success'
`

db.query(sql,[userId,noteId],(err,result)=>{

if(result.length > 0){
res.json({allowed:true})
}else{
res.json({allowed:false})
}

})

})
*/

router.get("/access/:noteId", authMiddleware, (req,res)=>{

const userId = req.user.id
const { noteId } = req.params

const sql = `
SELECT * FROM payments
WHERE user_id=? AND note_id=? AND status='success'
`

db.query(sql,[userId,noteId],(err,result)=>{

if(result.length > 0){
res.json({allowed:true})
}else{
res.json({allowed:false})
}

})

})


const storage = multer.diskStorage({

destination: function (req, file, cb) {
cb(null, "uploads/");
},

filename: function (req, file, cb) {
cb(null, Date.now() + "-" + file.originalname);
}

});

const upload = multer({ storage: storage });

/* Upload Note */

router.post("/upload", upload.single("pdf"), (req, res) => {

const { title, price } = req.body;

const filePath = req.file.filename;

const sql = `
INSERT INTO notes (title, price, file_path)
VALUES (?, ?, ?)
`;

db.query(sql, [title, price, filePath], (err) => {

if (err) {
console.log(err);
return res.status(500).json(err);
}

res.json({
message: "Note uploaded successfully"
});

});

});

router.get("/get-file/:noteId", (req,res)=>{

const noteId = req.params.noteId

const sql = "SELECT file_path FROM notes WHERE id=?"

db.query(sql,[noteId],(err,result)=>{

if(err || result.length===0){
return res.status(404).send("Not found")
}

res.json({
file: result[0].file_path
})

})

})

// ✅ MY LIBRARY
router.get("/my", authMiddleware, (req,res)=>{

const userId = req.user.id

const sql = `
SELECT notes.id, notes.title 
FROM payments 
JOIN notes ON payments.note_id = notes.id
WHERE payments.user_id=? AND payments.status='success'
`

db.query(sql,[userId],(err,result)=>{
if(err){
console.log(err)
return res.json([])
}
res.json(result)
})

})

const path = require("path")
const fs = require("fs")


// ✅ SECURE FILE
router.get("/secure-file/:noteId", authMiddleware, (req,res)=>{

const userId = req.user.id
const { noteId } = req.params

const checkSql = `
SELECT * FROM payments
WHERE user_id=? AND note_id=? AND status='success'
`

db.query(checkSql,[userId,noteId],(err,result)=>{

if(err || result.length===0){
return res.status(403).send("Not allowed ❌")
}

const fileSql = "SELECT file_path FROM notes WHERE id=?"

db.query(fileSql,[noteId],(err,data)=>{

if(err || data.length===0){
return res.status(404).send("File not found")
}

const path = require("path")
const fs = require("fs")

const filePath = path.join(__dirname,"../uploads",data[0].file_path)

if(!fs.existsSync(filePath)){
return res.status(404).send("File missing")
}

res.setHeader("Content-Type","application/pdf")
res.setHeader("Content-Disposition","inline")

fs.createReadStream(filePath).pipe(res)

})

})

})




module.exports = router;