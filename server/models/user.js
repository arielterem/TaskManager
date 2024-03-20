const mongoose = require('mongoose')

const schema = mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        require: true,
    },
    password:{
        type: String,
        require: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
    },
    fullName:{
        type: String,
        require: true
    },
    // role: {
    //     type: String,
    //     enum: ["appOwner", "officeManager", "teamManager", "user"],
    //     required: true,
    // },
    permissionsStatus: { // 1-appOwner | 2-officeManager | 3-teamManager | 4-user
        type: Number,
        min: 1,
        max: 4,
        require: true,
    },
    officeId: {
        type: String,
        require: true
    }
})

module.exports = mongoose.model('User', schema)