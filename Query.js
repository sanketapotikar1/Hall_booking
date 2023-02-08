// booking database Query with joins || Query for vlookup on databases

db.booking.aggregate(
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "_id",
      as: "booking_details_of_customers",
    },
  },
  {
    $project: {
      _id: 0,
      "customers_booking_details.name": 1,
    },
  }
);

// Query for vlookup on databases - Result
const vlookup = {
  _id: ObjectId("63db63693d0a64698f8900c3"),
  Booking_id: 1,
  customer_id: ObjectId("63d3c9f8b88df74fb6f8cd56"),
  room_id: ObjectId("63d3c25fb88df74fb6f8cd53"),
  customers_booking_details: [
    {
      _id: ObjectId("63d3c9f8b88df74fb6f8cd56"),
      c_id: "1",
      name: "Sanket Apotikar",
      booking: {
        Date: "2023-01-17T00:00:00.000Z",
        "start-time": "09:00",
        "end-time": "18.00",
      },
    },
  ],
};
{
  $unwind: "$booking_Details";
}

// lookup query for booked room details
db.booking
  .aggregate(
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
    }
  )
  .sort({ Date: -1 });

// lookup query for customer with booked rooms details
db.booking
  .aggregate(
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
    }
  )
  .sort({ Date: -1 });

// Query for insert in booking database.
db.booking.insertOne({
  customer_id: ObjectId("63dbb2203d0a64698f8900c6"),
  room_id: ObjectId("63dbbdba3d0a64698f8900c9"),
  Date: "2023-01-17T00:00:00.000+00:00",
  start_time: "2023-11-30T11:00:00.000+00:00",
  end_time: "2023-11-30T12:00:00.000+00:00",
});

// Customers data for Hall Booking
db.customers.insertMany([
  {
    customer_id: 100,
    customer_name: "Sanket Apotikar",
    Customer_mobile: "9011437740",
    customer_email: "sanket@test.com",
    city: "pune",
    Pincode: "411033",
  },
  {
    customer_id: 101,
    customer_name: "Vaibhav Bundile",
    Customer_mobile: "8515437740",
    customer_email: "Vaibhav@test.com",
    city: "Mumbai",
    Pincode: "417533",
  },
  {
    customer_id: 102,
    customer_name: "Shubham Ballal",
    Customer_mobile: "7845123698",
    customer_email: "shubham@test.com",
    city: "Satara",
    Pincode: "418526",
  },
]);

// rooms data for hall booking
db.rooms.insertMany([
  {
    room_name: "Executive",
    amenities: [
      "A+ customer service",
      "sound system",
      "3D lighting",
      "projector",
      " FreeParking",
      "CCTV Security",
      "Free food",
    ],
    Price_per_hour: 3000,
    seat_count: 100,
    available: true,
  },
  {
    room_name: "King Hall",
    amenities: [
      "sound system",
      "3D lighting",
      "projector",
      " FreeParking",
      "CCTV Security",
      "Free food",
    ],
    Price_per_hour: 2000,
    seat_count: 100,
    available: true,
  },
  {
    room_name: "GOld Hall",
    amenities: [
      "3D lighting",
      "projector",
      " FreeParking",
      "CCTV Security",
      "Free food",
    ],
    Price_per_hour: 1500,
    seat_count: 75,
    available: true,
  },
  {
    room_name: "Silver Hall",
    amenities: ["projector", " FreeParking", "CCTV Security", "Free food"],
    Price_per_hour: 1000,
    seat_count: 50,
    available: true,
  },
]);

//update query for customers
db.customers.updateMany(
  {},
  {
    $set: {
      Bookings: [ObjectId("63db9d863d0a64698f8900c5")],
    },
  }
);

//Query for insert id into customer
db.customers.updateMany(
  {},
  {
    $push: {
      Bookings: ObjectId("63db9d863d0a64698f8900c4"),
    },
  }
);

// Query for insert id into rooms
db.rooms.updateMany(
  {},
  {
    $push: {
      Bookings: ObjectId("63db9d863d0a64698f8900c4"),
    },
  }
);

app.post("/createroom", express.json(), async function (req, res) {
  const data = req.body;
  console.log("creating room-", data);

  let insertResult;

  try {
    data.booking_status = "available";
    insertResult = await client.db("hall").collection("rooms").insertOne(data);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      console.error("# Duplicate Data Found:\n", err);
      insertResult = {
        insertedId: null,
        message: "duplicate key error : please Enter new room id.",
      };
    } else {
      throw new Error(err);
    }
  }
  res.send(insertResult);
});

const bookRoom = {
  customer_id: "63dbb2203d0a64698f8900c6",
  room_id: "63dbbdba3d0a64698f8900c8",
  Date: "2023-06-25",
  "startTime ": "17:00",
  endTime: "16:00",
};

app.post("/bookroom/", async function (req, res) {
  const data = req.body;
  const { id, booking_date, start_time, end_time } = data;
  data.booking_date = new Date(booking_date);
  data.start_time = new Date(booking_date + "T" + start_time + ":00.000Z");
  data.end_time = new Date(booking_date + "T" + end_time + ":00.000Z");
  data.booking_status = "booked";

  let isbookedresult;

  isbookedresult = await client
    .db("hall")
    .collection("booked_rooms")
    .find({
      $and: [
        {
          $or: [
            {
              $and: [
                { start_time: { $lte: new Date(data.start_time) } },
                { end_time: { $gte: new Date(data.start_time) } },
              ],
            },
            {
              $and: [
                { start_time: { $lte: new Date(data.end_time) } },
                { end_time: { $gte: new Date(data.end_time) } },
              ],
            },
          ],
        },
        { id: id },
      ],
    })
    .toArray();

  if (isbookedresult.length == 0) {
    let result = await client
      .db("hall")
      .collection("booked_rooms")
      .insertOne(data);

    let updateresult = await client
      .db("hall")
      .collection("rooms")
      .updateOne({ _id: ObjectId(id) }, { $set: { booking_status: "Booked" } });

    res.send(result);
  } else {
    res.send("Room is already booked for particular time");
  }
});
