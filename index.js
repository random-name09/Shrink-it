const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const shortId = require('shortid')
require('dotenv').config();

const app = express();
const link = require('./models/link');

const port = process.env.PORT || 3000;


mongoose.connect(process.env.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.mongoURL }),
});

app.use(sessionMiddleware);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));


const linkSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true,
  },
  tiny: {
    type: String,
    required: true,
    default: () => shortId.generate(),
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  session: {
    type: String,
    required: true,
  },
});

const Link = mongoose.model('Link', linkSchema);


app.post('/Shrink', async (req, res) => {
  const sessionId = req.session.id;
  console.log(sessionId);
  try {
    await Link.create({
      full: req.body.FullURL,
      session: sessionId,
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/', async (req, res) => {
  const sessionId = req.session.id;

  try {
 
    const sessionExists = await Link.exists({ session: sessionId });
    console.log(sessionExists);
    if (sessionExists) {
      const shrinks = await Link.find({ session: sessionId });
      res.render('index.ejs', { Shrinks: shrinks });
    } else {

      res.render('index.ejs', { Shrinks: [] }); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/:Shrink', async (req, res) => {
  const turl = await Link.findOne({ tiny: req.params.Shrink });
  if (turl == null) {
    return res.sendStatus(404);
  }

  turl.clicks++;
  turl.save();

  res.redirect(turl.full);
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
