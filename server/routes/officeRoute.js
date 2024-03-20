const express = require('express');
const common = require('../common');
const Office = require('../models/office')
const User = require('../models/user')
const router = express.Router();
const Task = require('../models/task')


router.get('/getTaskGroups/:id', common.verifyToken(4), async (req, res) => {
    try {
        const id = req.params.id;
        const office = await Office.findOne({ _id: id });

        if (office) {
            // Assuming taskGroups is a property of the office object
            const taskGroups = office.taskGroups || [];

            // You might want to send taskGroups as the response
            res.json(taskGroups);
        } else {
            res.status(404).send('Office not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    } finally {
        res.end();
    }
});


// router.get('/getTaskGroups/:id', common.verifyToken(40), async (req, res) => {
//     console.log('task groups');
//     const id = req.params.id;
//     const office = await Office.findOne({ _id: id });

//     if (office) {
//         taskGroups = req.body.taskGroups;
//     }
//     try {
//         await office.save();
//         res.send(office);
//         res.end();
//     } catch (err) {
//         res.status(505);
//         res.send(err);
//         res.end();
//     }
// });


router.get('/getOffice/:id', common.verifyToken(2), async (req, res) => {
    const id = req.params.id
    const office = await Office.findOne({ _id: id })

    if (office) {
        officeName = req.body.officeName,
            officePassword = req.body.officePassword,
            taskGroups = req.body.taskGroups
    }
    try {
        await office.save()
        res.send(office)
        res.end()
    }
    catch (err) {
        res.status(505)
        res.send(err)
        res.end()
    }
})


router.put('/updateOffice/:id', common.verifyToken(2), async (req, res) => {
    const id = req.params.id;
    const { officeName, officePassword } = req.body;

    try {
        const updatedOffice = await Office.findByIdAndUpdate(id, { officeName, officePassword }, { new: true });

        if (!updatedOffice) {
            return res.status(404).send("Office not found");
        }

        res.send(updatedOffice);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.put('/renameTaskGroup/:officeId', common.verifyToken(2), async (req, res) => {
    const id = req.params.officeId;
    let { currentValue, valueToChange } = req.body;

    // Format valueToChange to lowercase, remove non-alphabetic characters, and capitalize first letter of each word
    valueToChange = valueToChange.trim().replace(/[^a-zA-Z\s]/g, '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

    try {
        // Check if the valueToChange is already taken
        const existingOffice = await Office.findOne({ _id: id, taskGroups: valueToChange });
        if (existingOffice) {
            return res.status(400).send("The new value is already taken.");
        }

        // Update the taskGroup in the Office document
        const updatedOffice = await Office.findOneAndUpdate(
            { _id: id, taskGroups: currentValue }, // Find the office by ID and current value
            { $set: { 'taskGroups.$': valueToChange } }, // Set the matching taskGroup to the new value
            { new: true }
        );

        // Update the taskGroup in related Task documents
        const updatedTasks = await Task.updateMany(
            { officeId: id, taskGroup: currentValue }, // Find tasks by officeId and current value
            { $set: { taskGroup: valueToChange } } // Set the matching taskGroup to the new value
        );

        if (!updatedOffice || updatedTasks.nModified === 0) {
            return res.status(404).send("Office not found or currentValue not found in taskGroups");
        }

        res.send(updatedOffice);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/createTaskGroup/:officeId', common.verifyToken(2), async (req, res) => {
    try {
        const officeId = req.params.officeId;
        let taskGroupName = req.body.taskGroupName;
        taskGroupName = taskGroupName.trim().replace(/[^a-zA-Z\s]/g, '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

        const office = await Office.findOne({ _id: officeId });
        if (!office) {
            return res.status(404).json({ error: 'Office not found' });
        }

        // Check if the task group name already exists in the specified office
        const existingTaskGroup = office.taskGroups.includes(taskGroupName);

        if (existingTaskGroup) {
            return res.status(400).json({ error: 'Task group name already exists' });
        }

        // Create the new task group
        office.taskGroups.push(taskGroupName);
        await office.save();

        res.status(201).json({ message: 'Task group created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while creating the task group' });
    }
});

router.delete('/deleteTaskGroup/:officeId', common.verifyToken(2), async (req, res) => {
    try {
        const officeId = req.params.officeId;
        const taskGroupName = req.query.taskGroupName; // Retrieve taskGroupName from the URL query

        const office = await Office.findOne({ _id: officeId });
        if (!office) {
            return res.status(404).json({ error: 'Office not found' });
        }

        // Check if the task group exists in the office's taskGroups array
        const taskGroupIndex = office.taskGroups.indexOf(taskGroupName);
        if (taskGroupIndex === -1) {
            return res.status(404).json({ error: 'Task group not found in the office' });
        }

        // Remove the task group from the array
        office.taskGroups.splice(taskGroupIndex, 1);

        // Save the updated office document
        await office.save();

        res.status(200).json({ message: "Task group deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while deleting the task group");
    } finally {
        res.end();
    }
});





































router.get('/', common.verifyToken, async (req, res) => { //, common.verifyToken 
    let offices = await Office.find()
    res.json(offices);
    res.end()
})
router.get('/:id', common.verifyToken, async (req, res) => {
    try {
        const office = await Office.findOne({ _id: req.params.id });
        let data = {
            _id: office._id,
            officeName: office.officeName,
            officePassword: office.officePassword,
            taskGroups: office.taskGroups
        }
        res.send(data)
    }
    catch {
        res.send('invalid id')
    }
    res.end()
})
router.get('/getOfficeByOnlineUser/:id', common.verifyToken, async (req, res) => {
    try {
        console.log('here222222222222222222222222222222')

        const user = await User.findOne({ _id: req.params.id });
        if (user) {
            const office = await Office.findOne({ _id: user.officeId });
            let data = {
                _id: office._id,
                officeName: office.officeName,
                officePassword: office.officePassword,
                taskGroups: office.taskGroups
            }
            res.send(data)

        }
    }
    catch {
        res.send('invalid id')
    }
    res.end()
})

router.post('/', common.verifyToken, async (req, res) => {
    const office = new Office({
        officeName: req.body.officeName,
        officePassword: req.body.officePassword,
        taskGroups: req.body.taskGroups
    })

    try {
        await office.save()
        res.send(office)
        res.end()
    }
    catch (err) {
        res.status(404)
        res.send(err)
        res.end()
    }
})




module.exports = router