const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


// middle wares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zzty5cj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const dbConnect = async () => {
    try {
        await client.connect();
        console.log("Database connected successful");
    } catch (error) {
        console.log(error.message);
    }
};
dbConnect();


// DATABASE COLLECTION
const Users = client.db("Build-team").collection('users');
const Team = client.db("Build-team").collection('team');

app.get("/", (req, res) => {
    res.json({ message: "API is running here" });
});


app.get('/users', async (req, res) => {
    try {
        const { count, name } = req.query;
        let query = {};
        if (name) {
            query = { $text: { $search: name } }
        }

        const users = await Users.find(query).skip(Number(count) * 20).limit(20).toArray();
        const totalUsers = await Users.estimatedDocumentCount();

        res.send({
            success: true,
            data: users,
            totalUsers
        })
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/users', async (req, res) => {
    try {
        const count = req.query.count;
        const { domain, gender, available } = req.body;

        const query = { $and: [{ domain: domain }, { gender: gender }, { available: Boolean(available) }] };
        const users = await Users.find(query).skip(Number(count) * 20).limit(20).toArray();
        const totalUsers = await Users.estimatedDocumentCount();

        res.send({
            success: true,
            data: users,
            totalUsers
        })
    } catch (error) {
        console.log(error.message);
    }
});


app.get('/team', async (req, res) => {
    try {
        const team = await Team.find({}).toArray();
        const totalMember = await Team.estimatedDocumentCount();
        res.send({
            success: true,
            message: "Successfully got the team member",
            data: team,
            totalMember
        })
    } catch (error) {
        console.log(error.message);
    }
})


app.post('/team', async (req, res) => {
    try {
        const { member } = req.body;

        const updatedDoc = {
            $set: {
                available: false
            }
        };
        const updateFilter = { _id: ObjectId(member._id) }
        const updateResult = await Users.updateOne(updateFilter, updatedDoc);
        const result = await Team.insertOne(member);
        if (result.insertedId && updateResult.matchedCount) {
            res.send({
                success: true,
                message: "Successfully add a member"
            })
        }
    } catch (error) {
        console.log(error.message);
    }
})



app.listen(port, () => console.log(`Server is running on port ${port}`));

