const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// middle ware--
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lhckmem.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
};



async function run() {
    try {

        const usersCollection = client.db("billingPage").collection("users");

        const billingListCollection = client.db("billingPage").collection("billingList");

        
        //create jwt---------
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' });
                return res.send({ accessToken: token })
            }

            res.status(403).send({ accessToken: 'no token available' })

        });

        //save user data ---------
        app.put('/registration', async (req, res) => {
            const user = req.body
            const email = user.email
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        //save user login api ---------
        app.get('/login', async (req, res) => {
            const result = await usersCollection.find({}).toArray();
            res.send(result);
        });

        //get billing list ---------
        app.get('/billing-list', verifyJWT, async (req, res) => {
            const result = await billingListCollection.find({}).toArray();
            res.send(result);
        });

        //add a new billing ---------
        app.post('/add-billing', async (req, res) => {
            const newBill = req.body;
            const result = await billingListCollection.insertOne(newBill);
            res.send(result);
        });


        //delete a single bill ---------
        app.delete('/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await billingListCollection.deleteOne(query);
            res.send(result);
        });

        //get billing list ---------
        app.get('/update-billing/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await billingListCollection.findOne(query);
            res.send(result);
        });


        //update a bill ---------
        app.put('/update-billing', async (req, res) => {
            const updateBill = req.body
            const email = updateBill.email
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: updateBill,
            }
            const result = await billingListCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });




    }
    catch (err) {
        console.log(err);
    }
}


run().catch(err => console.log(err))



app.get('/', (req, res) => {
    res.send('Online billing Page server is running.............');
});

app.listen(port, () => {
    console.log('Online billing Page server running on:', port);
})