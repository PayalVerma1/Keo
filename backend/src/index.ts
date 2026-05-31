import express from "express"

const app = express()
app.use(express.json())

app.get("/",(req,res)=>{
    res.send("Hello from backend")
})

app.listen(3000,()=>{
    console.log("Server is running at port 3000")
})