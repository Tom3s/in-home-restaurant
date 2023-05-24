import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import setupRoutes from './Routes/SetupRoutes';
import Controller from './Controller/Controller';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const controller = new Controller();

app.use(express.json());

const cors = require('cors');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

setupRoutes(app, controller);

app.listen(port, () => {
	console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});