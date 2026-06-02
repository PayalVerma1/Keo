import { Express, Router } from "express";
import { prisma } from "../src/config/prisma.ts";
const router = Router();
router.post("/services",async(req,res)=>{
    try {
    const {name,description,ownerID} = req.body;
    const existingservice = await prisma.service.findFirst({
        where:{
            name,
            ownerID
        }
    });
    if(existingservice){
        return res.status(400).json({
            message:"Service found"
        });
    }
    const service = await prisma.service.create({
        data:{
            name,
            description,
            ownerID,
        },
    });
    res.status(201).json({
        message:"Service created",
        service,
    })
}
catch(e){
res.status(500).json({
    message:"External Server Error"
})
}
})