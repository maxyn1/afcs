import express from 'express';

const router = express.Router();

// Registration route
router.post('/register', (req, res) => {
    const newUser = req.body; // Assuming user data is sent in the request body
    // Here you would typically add logic to save the user to the database
    res.status(201).send(`User registered: ${JSON.stringify(newUser)}`);
});

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body; // Assuming credentials are sent in the request body
    // Here you would typically add logic to validate the user credentials
    res.status(200).send(`User logged in: ${username}`);
});

export default router;
