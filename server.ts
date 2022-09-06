import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

///////////////////////// GET ALL PASTES /////////////////////////////////////////////////////////
app.get("/pastes", async (req, res) => {

  try {
    const allPastes = await client.query('SELECT * FROM pastes ORDER BY date DESC LIMIT 10');
    res.json(allPastes.rows);
  } catch (error) {
    console.error(error.message)
  }
 
});

///////////////////////// GET SINGLE PASTE /////////////////////////////////////////////////////////
app.get("/pastes/:id", async (req, res) => {

  try {
    const {id} = req.params
    const singlePaste = await client.query('SELECT * FROM pastes WHERE paste_id = $1', [id]);
    res.json(singlePaste.rows[0]);
  } catch (error) {
    console.error(error.message)
  }
});


///////////////////////// POST SINGLE PASTE /////////////////////////////////////////////////////////
app.post("/pastes", async (req, res) => {

  try {
    const {title,body} = req.body
    const postPaste = await client.query(
      'INSERT INTO pastes (title,body) VALUES ($1,  $2) RETURNING *', [title,body]);

      res.json(postPaste.rows[0]);

  } catch (error) {
    console.error(error.message)
  }
});




//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
