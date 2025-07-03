import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import Auth from './routes/auth.routes.js'; 

dotenv.config(); // to access environment variables

const app = express();
const PORT = process.env.PORT;

app.use(helmet()); // to secure Express apps by setting various HTTP headers
app.use(morgan('dev')); // to log HTTP requests in the console
app.use(cookieParser()); // to parse cookies from the request headers
app.use(express.json()); // to extract json data from request body
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.get('/api', (req, res) => {
    res.send('API is running');
});

app.listen(PORT, () =>{
    console.log('Server is running on PORT: ' + PORT);
});