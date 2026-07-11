const multer = require('multer')


const storage = multer.diskStorage({
    destination: function (req,file,cb){
        // check file type
const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp']
if (!allowedFileTypes.includes(file.mimetype)){
    return cb(new Error('Invalid file type. Only Jpg, Png, Gif and Webp files are allowed.'))
}
    // check file size
    if(file.size > 5 *1024 * 1024){
        return cb( new Error('File size exceeds the limit of 5MB.'))
    }
   cb(null,'uploads/') 
},
filename: function (req,file,cb){
    cb(null,Date.now() + '-' + file.originalname)
},
})


module.exports = {
    multer,
    storage
}