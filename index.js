// common js syntax
// const express = require('express')
// const app = express()

// module js syntax
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

const PORT = process.env.PORT || 4000;

const app = express();
dotenv.config();

// middleware function for Json data
app.use(express.json());

// const MONGO_URL = `mongodb://127.0.0.1`; // node.js - 16 +
const MONGO_URL = "mongodb+srv://sanket:admin123@cluster0.iavuebx.mongodb.net/"; // Atlas link for mongodb


//Code for mongo connection
async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongo is connected ");
  return client;
}
const client = await createConnection();

// server listen on Port
app.listen(PORT, () => {
  console.log(`Server is Running at ${PORT}`);
});

// API for Home Page
app.get("/", function (req, res) {
  res.send("Welcome to Hall Booking API !!!");
});

// API for get room details
app.get("/rooms", async function (req, res) {
  //database connection for rooms collection
  const rooms = await client
    .db("Hall_Booking")
    .collection("rooms")
    .find({})
    .toArray();

  res.send(rooms);
});

// API for get customers details
app.get("/customers", async function (req, res) {
  const customers = await client
    .db("Hall_Booking")
    .collection("customers")
    .find({})
    .toArray();

  res.send(customers);
});

//API for get Booking Details
app.get("/bookings", async function (req, res) {
  const booking = await client
    .db("Hall_Booking")
    .collection("booking")
    .find({})
    .toArray();

  res.send(booking);
});

//API for create room
app.post("/createroom", async function (req, res) {
  const data = req.body;
  let createRoom = await client
    .db("Hall_Booking")
    .collection("rooms")
    .insertOne(data);

  res.send(`Room has been created successfully`);
});

//API for book a room
app.post("/bookroom", async function (req, res) {
  let data = req.body;
  let { customer_id, room_id, Date, startTime, endTime } = data;

  // convert string into Object ID
  data.customer_id = ObjectId(customer_id);
  data.room_id = ObjectId(room_id);
  // data.Date = new Date(Date);
  // data.startTime = new Date(Date + "T" + startTime + ":00.000Z");
  // data.endTime = new Date(Date + "T" + endTime + ":00.000Z");
  // data.booking_status = "booked";

  //Query for book room in booking collection
  let bookRoom = await client
    .db("Hall_Booking")
    .collection("booking")
    .insertOne(data);

  //Query for get booking id from booking collection
  let result = await client
    .db("Hall_Booking")
    .collection("booking")
    .findOne(data);
  console.log(result._id);

  // booking _id :
  let BookingId = result._id;

  //Query for adding booking id into rooms collection for perticular room
  let roomBooking = await client
    .db("Hall_Booking")
    .collection("rooms")
    .updateOne(
      {
        _id: ObjectId(room_id),
      },
      {
        $push: {
          Bookings: BookingId,
        },
      }
    );
  // Query for adding booking id in customer collection for perticular customer
  let CustomerBooking = await client
    .db("Hall_Booking")
    .collection("customers")
    .updateOne(
      {
        _id: ObjectId(customer_id),
      },
      {
        $push: {
          Bookings: BookingId,
        },
      }
    );

  res.send(bookRoom);
});

//API for booked room details
app.get("/listofbookedroom", async function (req, res) {
  let query = [
    {
      $lookup: {
        from: "rooms",
        localField: "room_id",
        foreignField: "_id",
        as: "booked_room_Details",
      },
    },
    {
      $unwind: "$booked_room_Details",
    },
    {
      $project: {
        _id: 0,
        "booked_room_Details.room_name": 1,
        Date: 1,
        startTime: 1,
        endTime: 1,
        "booked_room_Details.Price_per_hour": 1,
      },
    },
  ];

  const data = await client
    .db("Hall_Booking")
    .collection("booking")
    .aggregate(query)
    .sort({ Date: -1 })
    .toArray();
  res.send(data);
});

// API for customer details with booked data.
app.get("/customerbooking", async function (req, res) {
  let query = [
    {
      $lookup: {
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer_booking",
      },
    },
    {
      $unwind: "$customer_booking",
    },
    {
      $project: {
        _id: 0,
        "customer_booking.customer_name": 1,
        Date: 1,
        startTime: 1,
        endTime: 1,
      },
    },
  ];

  const data = await client
    .db("Hall_Booking")
    .collection("booking")
    .aggregate(query)
    .sort({ Date: -1 })
    .toArray();
  res.send(data);
});
