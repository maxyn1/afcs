import express from 'express';

const router = express.Router();

// Sample route for getting all users
router.get('/', (req, res) => {
    res.send('List of users');
});

// Sample route for creating a new user
router.post('/', (req, res) => {
    const newUser = req.body; // Assuming user data is sent in the request body
    res.status(201).send(`User created: ${JSON.stringify(newUser)}`);
});

export default router;
