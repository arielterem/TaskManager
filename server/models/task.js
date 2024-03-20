const mongoose = require('mongoose')

const schema = mongoose.Schema({
    title: {
        type: String,
        require: true,
    },
    description: String,
    priority: {
        type: Number,
        min: 1,
        max: 5,
        require: true,
    },
    isDone: {
        type: Boolean,
        require: true,
    },
    creationDate: Date,
    expDate: Date,
    documentation: [
        {
            date: {
                type: Date,
                default: Date.now,
                required: true
            },
            userFullName: {
                type: String,
                required: true
            },
            action: {
                type: String,
                required: true
            },
            info: {
                type: String,
                //required: true
            }
        }
    ],
    taskGroup: String,
    officeId: {
        type: String,
        require: true
    },
    archived:{
        type: Boolean,
        require: true,
    }
})

module.exports = mongoose.model('Task', schema)