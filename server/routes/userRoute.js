const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user')
const Office = require('../models/office');
const jwt = require('jsonwebtoken');
const router = express.Router();
const common = require('../common');


const secret = common.secret

router.get('/byOffice/:id', common.verifyToken(2), async (req, res) => {
    try {
        const office = await Office.findOne({ officeId: req.params._id });
        if (office) {
            const users = await User.find({ officeId: office._id }).select('-password');
            res.json(users);
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

router.put('/updatePermissions/:id', common.verifyToken(2), async (req, res) => {
    const id = req.params.id;
    const { permissions } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { permissionsStatus: permissions }, { new: true });

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.send(updatedUser);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/removeUser/:id', common.verifyToken(2), async (req, res) => {
    const id = req.params.id;

    try {
        const removedUser = await User.findByIdAndDelete(id);

        if (!removedUser) {
            return res.status(404).send("User not found");
        }

        res.send({ message: "User removed successfully" });
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/getPermission', common.verifyToken(4), async (req, res) => {
    try {
        const token = req.headers.authorization; // Use lowercase "authorization"
        const userId = await common.getUserId(token);

        if (!userId) {
            return res.status(404).send('User not found');
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.json(user.permissionsStatus);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('An internal server error occurred');
    }
});

router.get('/getUserId', common.verifyToken(4), async (req, res) => {
    try {
        const token = req.headers.authorization;
        const userId = await common.getUserId(token);

        if (!userId) {
            return res.status(404).send('User not found');
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.json(user._id);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('An internal server error occurred');
    }
});


























router.get('/', async (req, res) => {
    let users = await User.find()
    res.send(users)
    res.end()
})

// router.get('/:id', async (req, res) => {
//     try {
//         comsole.log('######',req.params.id)
//         const user = await User.findOne({ _id: req.params.id });
//         let data = {
//             _id: user._id,
//             userName : user.userName,
//             fullName : user.fullName,
//             email : user.email,
//             permissionsStatus :user.permissionsStatus,
//             officeId : user.officeId
//         }
//         res.send(data)
//     }
//     catch {
//         res.send('invalid id')
//     }
//     res.end()
// })
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (user) {
            let data = {
                _id: user._id,
                userName: user.userName,
                fullName: user.fullName,
                email: user.email,
                permissionsStatus: user.permissionsStatus,
                officeId: user.officeId
            };
            res.send(data);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        res.status(500).send('An error occurred');
    }
    finally {
        res.end()
    }
});


router.post('/regis/:officePassword', async (req, res) => {
    const { userName, email } = req.body;

    try {
        const userNameExists = await User.findOne({ $or: [{ userName }] });
        const emailExists = await User.findOne({ $or: [{ email }] });

        if (userNameExists && emailExists) {
            res.status(400).json({ error: 'Username and Email already exists' });
        } else if (userNameExists) {
            res.status(400).json({ error: 'Username already exists' });
        } else if (emailExists) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            // const office = await Office.findOne({ _id: req.params.officeID });
            try {
                const office = await Office.findOne({ _id: req.body.officeId });
                if (office) {
                    if (req.params.officePassword == office.officePassword) {
                        bcrypt.hash(req.body.password, 10).then(async (hashedPassword) => {
                            const user = new User({
                                userName: req.body.userName,
                                password: hashedPassword,
                                email: req.body.email,
                                fullName: req.body.fullName,
                                // permissionsStatus: req.body.permissionsStatus,
                                permissionsStatus: 4,
                                officeId: req.body.officeId
                            });
                            try {
                                await user.save();
                                res.status(201).json(user);
                            } catch (err) {
                                res.status(500).json({ error: 'Failed to save user' });
                            }
                        });

                    }
                    else {
                        res.status(400).json({ error: 'Office password does not match.' });
                    }
                }
            }
            catch {
                res.status(400).json({ error: 'Office ID does not match.' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
});



router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ userName: req.body.userName });
        if (user) {
            bcrypt.compare(req.body.password, user.password).then((result) => {
                if (result) {

                    const token = jwt.sign({
                        userId: user._id,
                        // username: user.username,
                        // fullName: user.fullName,
                        // email: user.email,
                        permissionsStatus: user.permissionsStatus,
                        officeId: user.officeId
                    }, secret)
                    res.send({
                        token: token,
                        userId: user._id,
                        userName: user.userName,
                        fullName: user.fullName,
                        email: user.email,
                        permissionsStatus: user.permissionsStatus,
                        officeId: user.officeId
                    })
                    res.end()
                    return;
                } else {
                    res.status(404);
                    res.send('Incorrect password');
                    res.end()
                    return;
                }
            });
        } else {
            res.status(404);
            res.send('Invalid user name or password');
            res.end()
            return;
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login');
    }
});


router.delete('/:id', async (req, res) => {
    try {
        await User.deleteOne({
            _id: req.params.id
        })
        res.status(200)
        res.send(await User.find())
        res.end()
    }
    catch (err) {
        res.status(500)
        res.send(err)
        res.end()
    }
})

router.put('/:id', async (req, res) => {
    const id = req.params.id
    const user = await User.findOne({ _id: id })

    if (user) {
        user.userName = req.body.userName,
            user.password = req.body.password,
            user.email = req.body.email,
            user.fullName = req.body.fullName,
            user.permissionsStatus = req.body.permissionsStatus,
            user.officeId = req.body.officeId
    }
    try {
        await user.save()
        res.send(user)
        res.end()
    }
    catch (err) {
        res.status(505)
        res.send(err)
        res.end()
    }
})


module.exports = router