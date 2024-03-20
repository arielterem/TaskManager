const mongoose = require('mongoose')

const schema = mongoose.Schema({
    officeName: {
        type: String,
        require: true,
    },
    officePassword:{
        type: String,
        require: true,
    },
    taskGroups: {
        type: [String], // Array of strings
        default: []
    }
})

module.exports = mongoose.model('Office', schema)