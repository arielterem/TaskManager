const express = require('express');
const common = require('../common');
const Task = require('../models/task')
const Office = require('../models/office')
const router = express.Router();
const mongoose = require('mongoose');


router.get('/getOfficeTasks', common.verifyToken(4), async (req, res) => { //V
    try {
        const token = req.headers.authorization;
        const officeId = await common.getOfficeId(token);

        const office = await Office.findOne({ _id: officeId });
        if (office) {
            // const tasks = await Task.find({ officeId: office._id });
            const tasks = await Task.find({
                officeId: office._id,
                $or: [
                    { archived: { $exists: false } }, // Include tasks without the archived property
                    { archived: false } // Include tasks where archived is explicitly set to false
                ]
            });
            res.json(tasks);
        } else {
            res.status(404).send('Office not found');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
    finally {
        res.end()
    }
});

router.get('/archivedTasksAtOffice', common.verifyToken(4), async (req, res) => { //V
    try {
        const token = req.headers.authorization;
        const officeId = await common.getOfficeId(token);

        const office = await Office.findOne({ _id: officeId });
        if (office) {
            const tasks = await Task.find({
                officeId: office._id,
                archived: true
            });
            res.json(tasks);
        } else {
            res.status(404).send('Office not found');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
    finally {
        res.end()
    }
});

router.post('/', common.verifyToken(3), async (req, res) => { //V
    try {
        const token = req.headers.authorization;
        const officeId = await common.getOfficeId(token);

        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority,
            isDone: req.body.isDone,
            creationDate: req.body.creationDate,
            expDate: req.body.expDate,
            documentation: req.body.documentation,
            taskGroup: req.body.taskGroup,
            officeId: officeId,
            archived: req.body.archived
        })

        // Save the task to the database
        const savedTask = await task.save();

        // Extract the _id from the savedTask and convert it to string format
        const taskId = savedTask._id.toHexString();

        // Modify the savedTask object to send back taskId instead of _id
        const responseTask = { ...savedTask.toObject(), _id: taskId };

        console.log(responseTask);
        res.send(responseTask)
        res.end()
    }
    catch (err) {
        res.status(404)
        res.send(err)
        res.end()
    }
})

router.put('/editTask', common.verifyToken(3), async (req, res) => { //V
    try {
        const token = req.headers.authorization;
        const officeId = await common.getOfficeId(token);

        const task = await Task.findOne({ _id: req.body._id, officeId: officeId });
        console.log('det', req.body._id, officeId);
        console.log(task);
        if (!task) {
            return res.status(404).send("Task not found");
        }
        // Update task properties
        task.title = req.body.title;
        task.description = req.body.description;
        task.priority = req.body.priority;
        task.isDone = req.body.isDone;
        task.expDate = req.body.expDate;
        task.documentation.push(req.body.documentation[0]);
        task.taskGroup = req.body.taskGroup;

        await task.save();
        res.send(task);
    } catch (err) {

        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.put('/archive/:id', common.verifyToken(3), async (req, res) => { //V
    const id = req.params.id;

    const token = req.headers.authorization;
    const officeId = await common.getOfficeId(token);

    try {
        const task = await Task.findOne({ _id: id, officeId: officeId });

        if (!task) {
            return res.status(404).send("Task not found");
        }
        // Update
        task.documentation.push(req.body.documentation);
        task.archived = true

        await task.save();
        res.send(task);
    } catch (err) {

        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.put('/unarchive/:id', common.verifyToken(3), async (req, res) => {
    const id = req.params.id;

    try {
        const task = await Task.findOne({ _id: id });

        if (!task) {
            return res.status(404).send("Task not found");
        }
        // Update
        task.documentation.push(req.body.documentation);
        task.archived = false

        await task.save();
        res.send(task);
    } catch (err) {

        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.delete('/:id', common.verifyToken(3), async (req, res) => {
    try {
        await Task.deleteOne({
            _id: req.params.id
        })
        res.status(200)
        res.send(await Task.find())
        res.end()
    }
    catch (err) {
        res.status(500)
        res.send(err)
        res.end()
    }
})

router.put('/addDocumentation/:id', common.verifyToken(4), async (req, res) => {
    const id = req.params.id;

    try {
        const task = await Task.findOne({ _id: id });

        if (!task) {
            return res.status(404).send("Task not found");
        }
        // Update
        console.log('doc', req.body.documentation);
        task.documentation.push(req.body.documentation);

        await task.save();
        res.send(task);
    } catch (err) {

        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/getTasksByTaskGroup', common.verifyToken(2), async (req, res) => {
    try {
        const { taskGroup, officeId } = req.query;

        // Check if both taskGroup and officeId are provided
        if (!taskGroup || !officeId) {
            return res.status(400).send('Both taskGroup and officeId are required parameters');
        }

        // Use a regular expression to perform a case-insensitive search
        const tasks = await Task.find({ taskGroup: { $regex: new RegExp(taskGroup, 'i') }, officeId: officeId });

        return res.json(tasks);

    } catch (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
    }
});

router.put('/editArchiveAndTaskGroups', common.verifyToken(2), async (req, res) => {

    console.log('good');
    try {
        const { archiveChangesList, taskGroupChangesList } = req.body;

        console.log('Lists:', archiveChangesList, taskGroupChangesList);

        // Update tasks based on archiveChangesList
        if (archiveChangesList && archiveChangesList.length > 0) {
            await Task.updateMany(
                { _id: { $in: archiveChangesList.map(change => change._id) } },
                { $set: { archive: { $in: archiveChangesList.map(change => change.archive) } } }
            );
        }

        // Update tasks based on taskGroupChangesList
        if (taskGroupChangesList && taskGroupChangesList.length > 0) {
            await Task.updateMany(
                { _id: { $in: taskGroupChangesList.map(change => change._id) } },
                { $set: { taskGroup: { $in: taskGroupChangesList.map(change => change.taskGroup) } } }
            );
        }

        res.send({ msg: "Tasks updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/countTasksInTaskGroup/:taskGroup', common.verifyToken(4), async (req, res) => {
    try {
        const taskGroup = req.params.taskGroup;

        // Assuming `Task` is a model or class that represents your tasks
        const tasks = await Task.find({ taskGroup: taskGroup });
        const tasksCount = tasks.length;

        return res.json({ count: tasksCount });
    } catch (err) {
        console.error(err);
        return res.status(500).send('An error occurred');
    }
});









































router.get('/', common.verifyToken, async (req, res) => { //, common.verifyToken 
    let tasks = await Task.find()
    res.json(tasks);
    res.end()
})
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id });
        if (task) {
            let data = {
                title: req.body.title,
                description: req.body.description,
                priority: req.body.priority,
                isDone: req.body.isDone,
                creationDate: req.body.creationDate,
                expDate: req.body.expDate,
                documentation: req.body.documentation,
                taskGroup: req.body.taskGroup,
                officeId: req.body.officeId
            };
            res.send(data);
        } else {
            res.status(404).send('Task not found');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
    finally {
        res.end()
    }
});







// router.delete('/:id', common.verifyToken, async (req, res) => {
//     try {
//         await Task.deleteOne({
//             _id: req.params.id
//         })
//         res.status(200)
//         res.send(await Task.find())
//         res.end()
//     }
//     catch (err) {
//         res.status(500)
//         res.send(err)
//         res.end()
//     }
// })



router.put('/moveTasksToTaskGroup/:id', async (req, res) => {
    try {
        const office = await Office.findOne({ officeId: req.params._id });
        if (office) {
            const tasks = await Task.find({ officeId: office._id });
            const parts = req.params.value.split('|'); //0 - remove | 1 - change to
            tasks.forEach(i => {
                if (i.taskGroup == parts[0]) {
                    i.taskGroup = parts[1]
                }
            })
            res.json(tasks);
        } else {
            res.status(404).send('Office not found');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
    finally {
        res.end()
    }
});


module.exports = router