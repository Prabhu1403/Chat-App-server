import multer from "multer";
import path from "path";
import fs from "fs"


const destination = "uplodes/images"

if(!fs.existsSync(destination)){
    fs.mkdirSync(destination, { recursive: true })
}

const storage = multer.diskStorage({
    destination:(req: any, file: any, cb: any)=>{
      cb(null,destination)
    },
    filename:(req: any, file: any, cb: any)=>{
        const fileExtension = file.originalname.split(".").pop();
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null,uniqueSuffix + "." + fileExtension)
    }
     
})

const fileFilter = (req: any,file: any,cb: any)=>{
      const validFileTypes = ["image/jpeg","image/png","image/jpg"]
      if(validFileTypes.includes(file.mimetype)){
        cb(null,true)
      }else{
        cb(new Error("Invalid file type"))
      }
}

export const uploades = multer({
    storage:storage,
    fileFilter:fileFilter,
    limits:{
        fileSize:1024*1024*2
    }
});

