// Import required modules
const express = require("express"); // Import Express.js framework
const cors = require("cors"); // Import CORS middleware for cross-origin requests
const data = require("./db.json"); // Import data from a JSON file

// Create an Express application instance
const app = express();

// Enable CORS to allow requests from different origins
app.use(cors());

// Parse incoming JSON data
//built-in middleware function in Express
app.use(express.json());

/*  Define routes for the application */

// Root route (homepage)
app.get("/", (request, response) => {
    response.send(`<div>
  
    <h1 style="text-align: center;">Hall Booking System</h1>
    <div style="display:flex; justify-content: center;">
        <div>
            <h2>GET API Endpoints</h2>
            <ul>
                <li>
                    <div>
                        <a href="/api/v1/rooms">View all rooms</a>
                        <p><code>/api/v1/rooms</code></p>
                    </div>
                </li>

                <li>
                    <div>
                        <a href="/api/v1/customers">View all customers</a>
                        <p><code>/api/v1/customers</code></p>
                    </div>
                </li>


                <li>
                    <div>
                        <a href="/api/v1/bookingDetails">View all booking details</a>
                        <p><code>/api/v1/bookingDetails</code></p>
                    </div>
                </li>

                <li>
                    <div>
                        <a href="/api/v1/bookedRooms">View all booked rooms</a>
                        <p><code>/api/v1/bookedRooms</code></p>
                    </div>
                </li>

                <li>
                    <div>
                        <a href="/api/v1/customerBookings">View all customer wise booking details</a>
                        <p><code>/api/v1/customerBookings</code></p>
                    </div>
                </li>

                <li>
                    <div>
                        <a href="/api/v1/nonBookedRooms">View all non booked rooms details</a>
                        <p><code>/api/v1/nonBookedRooms</code></p>
                    </div>
                </li>

            </ul>
        </div>
        <div>
        <h2>POST API Endpoints</h2>
        <ul>
            <li>
                <div>
                    <a href="/api/v1/createRoom">Create a new room</a>
                    <p><code>/api/v1/createRoom</code></p>
                </div>
            </li>

            <li>
                <div>
                    <a href="/api/v1/booking">Book a room with customer details</a>
                    <p><code>/api/v1/booking</code></p>
                </div>
            </li>


            

        </ul>
    </div>
  </div>
  </div>`);
});

// API Endpoit to retrieve room details
app.get("/api/v1/rooms", (request, response) => {
    let roomsDetails = data.room;

    response.status(200).json(roomsDetails);
});

// API Endpoint retrieve customer details
app.get("/api/v1/customers", (request, response) => {
    let customerDetails = data.customer_Details;

    response.json(customerDetails);
});

// API Endpoint retrieve booking details
app.get("/api/v1/bookingDetails", (request, response) => {
    let bookingDetails = data.booking_Details;

    response.status(200).json(bookingDetails);
});

// API Endpoint retrieve booked room details
app.get("/api/v1/bookedRooms", (request, response) => {
    //get all rooms from the data
    let rooms = JSON.parse(JSON.stringify(data.room));
    // let rooms = JSON.stringify(data.rooms)
    //Filter booked rooms
    let allBookedRooms = rooms.filter((eachRoom) => {
        if (eachRoom) {
            return eachRoom.booked_Status ? eachRoom : null;
        }
    });

    allBookedRooms.forEach((eachRoom) => {
        data.booking_Details.forEach((eachBooking) => {
            if (eachBooking.room_Id == eachRoom.room_Id) {
                if (!eachRoom.bookingDetails) {
                    eachRoom.bookingDetails = [eachBooking];
                } else {
                    eachRoom.bookingDetails.push(eachBooking);
                }
            }
        });

        data.customer_Details.forEach((eachCustomer) => {
            if (eachCustomer.room_Id == eachRoom.room_Id) {
                if (!eachRoom.customerDetails) {
                    eachRoom.customerDetails = [eachCustomer];
                } else {
                    eachRoom.customerDetails.push(eachCustomer);
                }
            }
        });
    });


    //Send the response with enhanced booked room data
    response.status(200).json(allBookedRooms);
});

// API Endpoint  to retrieve customer bookings
app.get("/api/v1/customerBookings", (request, response) => {
    //Get all customer data
    let customers = data.customer_Details;

    //Enhance each customer with booking details and total bookings
    customers.forEach((eachCustomer) => {
        //Add booking details if not already present
        if (!eachCustomer.bookingDetails) {
            // Filter bookings for the specific customer
            eachCustomer.bookingDetails = data.booking_Details.filter(
                (eachBooking) => {
                    if (eachBooking.customer_Id == eachCustomer.customer_Id) {
                        return eachBooking;
                    }
                }
            );
        }

        // Calculate total bookings if not already calculated
        if (!eachCustomer.totalBookings) {
            // Count the number of bookings
            eachCustomer.totalBookings = eachCustomer.bookingDetails.length;
        }
    });

    // Send the response with enhanced customer data
    response.status(200).json(customers);
});

// API Endpoint to retrieve non-booked rooms
app.get("/api/v1/nonBookedRooms", (resuest, response) => {
    //Filter rooms that are not booked
    let nonBookedRooms = data.room.filter((eachRoom) => {
        if (!eachRoom.booked_Status) {
            return eachRoom;
        }
    });

    //Send the response with non-booked rooms
    response.status(200).json(nonBookedRooms);
});

app.post("/api/v1/createRoom", (request, response) => {
    let roomDefaultObj = {
        room_Id: data.room.length + 1,
        room_Name: "",
        amenities: [],
        price_perHour: 0,
        seats: 0,
        booked_Status: false,
        booking_Confirmation_Id: [],
    };

    let newRoom = { ...roomDefaultObj, ...request.body };

    data.room = [...data.room, newRoom];
    response.status(201).json({ message: "New room created successfully" });
});

// API endpoint to handle room booking requests
app.post("/api/v1/booking", (request, response) => {
    //Find the selected room
    let selctedRoom = data.room.find((eachRoom) => {
        // Case-insensitive room name comparison
        if (
            eachRoom.room_Name == request.body.room_Name.toLowerCase() ||
            eachRoom.room_Name == request.body.room_Name.toUpperCase()
        ) {
            return eachRoom;
        }

        return null;
    });

    // 2. Generate a booking confirmation ID
    let bookingId = getBookingId();

    // Function to generate a unique booking confirmation ID
    function getBookingId() {
        // Get current timestamp
        let date = Date.now();

        // Convert timestamp to base-36 string and Add random character
        let id =
            date.toString(36) +
            Math.floor(
                Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
            ).toString(36);

        return id;
    }

    //Process booking if the room is found
    if (selctedRoom) {
        //Create a customer object with default values and request data
        let customerDefaultObj = {
            customer_Id: data.customer_Details.length + 1,
            customer_Name: "",
            customer_Email: "",
            customer_Phone: 0,
            date: 0,
            start_Time: 0,
            end_Time: 0,
            room_Name: "",
            room_Id: selctedRoom ? selctedRoom.room_Id : null,
        };

        //Create a new customer object
        let newCustomer = { ...customerDefaultObj, ...request.body };

        //Create a booking details object
        let booking_Details = {
            booking_Id: data.booking_Details.length + 1,
            booking_Confirmation_Id: bookingId,
            date: newCustomer.start_Time,
            room_Id: selctedRoom ? selctedRoom.room_Id : null,
            customer_Id: newCustomer.customer_Id,
        };

        //Update room status and booking confirmation IDs
        data.room = data.room.map((eachRoom) => {
            if (eachRoom.room_Id == selctedRoom.room_Id) {
                eachRoom.booked_Status = true;
                if (eachRoom.booked_Status) {
                    eachRoom.booking_Confirmation_Id.push(bookingId);
                }
            }

            return eachRoom;
        });

        //Add new customer and booking details to data
        data.customer_Details.push(newCustomer);
        data.booking_Details.push(booking_Details);

        //Send a 201 Created response with success message
        response.status(201).json({ message: "Room successfully booked" });
    } else {
        //Send a 404 Not Found response if the room is not found
        response.status(404);
        response.json({ message: "Room not found" });
    }
});

app.get("*", (request, response) => {
    response.status(404).json({ message: "API endpoint Not Found" });
});

app.post("*", (request, response) => {
    response.status(404).json({ message: "API endpoint Not Found" });
});

const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
