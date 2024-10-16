require('dotenv').config();
const express        = require('express');
let app              = express();
const path           = require('path');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const bodyParser     = require('body-parser');
const connect        = require('./utils/dbConnection')
const { Server } = require('socket.io'); 

//-----------------   routes   -----------------------//
const userRouter      = require('./routes/userRoutes')()
const adminRouter     = require('./routes/adminRoutes')()
const medicineRouter  = require('./routes/medicineRoute')()
const categoryRouter  = require('./routes/categoryRoutes')()
const buyerRouter     = require('./routes/buyerRoutes')()
const sellerRouter    = require('./routes/sellerRoutes')()
const supplierRouter  = require('./routes/supplierRoutes')()
const guestRouter     = require('./routes/guestRoutes')()
const orderRouter     = require('./routes/orderRoutes')()
const enquiryRouter   = require('./routes/enquiryRoutes')()
const purchaseRouter  = require('./routes/purchaseOrderRoutes')()
const invoiceRouter   = require('./routes/invoiceRoutes')()
//-----------------   routes   -----------------------//

//db-connection
connect()


app.use('/uploads', express.static('uploads'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const corsOptions = {
  origin: [
    'http://192.168.1.31:2221',
    'http://192.168.1.82:3000',
    'http://192.168.1.42:3000',
    'http://192.168.1.87:3000',
    'http://localhost:2221',
    'http://localhost:3030',
    'http://192.168.1.34:3333',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3333',
    'https://supplierdeliver.shunyaekai.com',
    'https://buyerdeliver.shunyaekai.com',
    'https://deliver.shunyaekai.com'
  ],
  methods: 'GET, POST',
  credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.use(bodyParser.json({ limit: '500000mb' }));

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//------------------------------ api routes ------------------//
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

//----------medicine-------------//
app.use('/api/medicine', medicineRouter);
app.use('/api/buyer/medicine', medicineRouter);
app.use('/api/supplier/medicine', medicineRouter);
app.use('/api/admin/medicine', medicineRouter);
//---------------medicine------------------//

app.use('/api/category', categoryRouter);
app.use('/api/buyer', buyerRouter);

app.use('/api/seller', sellerRouter);
// app.use('/api/buyer/seller', sellerRouter);

app.use('/api/supplier', supplierRouter);
app.use('/api/buyer/supplier', supplierRouter);

app.use('/api/guest', guestRouter);

//-----------------order--------------------------//
app.use('/api/order', orderRouter);
app.use('/api/buyer/order', orderRouter);
app.use('/api/supplier/order', orderRouter);
//-----------------order--------------------------//

//-----------------enquiry--------------------------// 
app.use('/api/enquiry', enquiryRouter);
app.use('/api/buyer/enquiry', enquiryRouter);
app.use('/api/supplier/enquiry', enquiryRouter);
//-----------------enquiry--------------------------//

//-----------------purchaseorder--------------------------// 
app.use('/api/purchaseorder', purchaseRouter);
app.use('/api/buyer/purchaseorder', purchaseRouter);
app.use('/api/supplier/purchaseorder', purchaseRouter);
//-----------------purchaseorder--------------------------//

//-----------------invoice--------------------------// 
app.use('/api/invoice', invoiceRouter);
app.use('/api/buyer/invoice', invoiceRouter);
app.use('/api/supplier/invoice', invoiceRouter);
//-----------------purchaseorder--------------------------//

//--------------- api routes ------------------//
const ADMIN_ID = process.env.ADMIN_ID
const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, (req, res) => {
  console.log(`server is runnig http://localhost:${PORT}/`);
});

const io = new Server(server, { // Initialize Socket.IO
  cors: {
    origin: [
      'http://192.168.1.31:2221',
      'http://192.168.1.82:3000',
      'http://192.168.1.42:3000',
      'http://192.168.1.14:3000',
      'http://localhost:2221',
      'http://localhost:3030',
      'http://192.168.1.34:3333',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3333',
      'https://supplierdeliver.shunyaekai.com',
      'https://buyerdeliver.shunyaekai.com',
      'https://deliver.shunyaekai.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected: ', socket.id);

  // Handle supplier registration (or user registration)
  socket.on('register', (userId) => {
      console.log(`User registered with ID: ${userId}`);
      socket.join(userId);  
      console.log('Current rooms:', socket.rooms);

      io.to(userId).emit('testNotification', 'This is a test notification.');
  });

//buyer registration
  socket.on('registerBuyer', (userId) => {
    console.log(`Buyer registered with ID: ${userId}`);
    socket.join(userId);  
    console.log('Currentttt rooms:', socket.rooms);
});

//admin registration
socket.on('registerAdmin', (userId) => {
  console.log(`Admin registered with ID: ${userId}`);
  socket.join(userId);  
  console.log('Currentttt admin rooms:', socket.rooms);
});

  // Handle sending notifications to specific users/suppliers
  socket.on('sendNotification', ({ userId, title, message }) => {
      io.to(userId).emit('notification', { title, message });
      console.log(`Notification sent to user ${userId}`);
      
  });

  // sendInquiry
  socket.on('sendInquiry', (data) => {
      const { supplierId, message } = data;  
      console.log('Current roomssss:', socket.rooms);
      console.log(`Sending inquiry to supplier ${supplierId}: ${message}`);
      io.to(supplierId).emit('newEnquiry', message);
  });

  // submitQuotation
  socket.on('submitQuotation', (data) => {
    const { buyerId, message } = data;
    io.to(buyerId).emit('enquiryQuotation', message);
  });

  // createPO
  socket.on('createPO', (data) => {
    const { supplierId, message, inquiryId } = data;
    io.to(supplierId).emit('POCreated', message);
  });

  // editPO
  socket.on('editPO', (data) => {
    const { supplierId, message, inquiryId } = data;
    io.to(supplierId).emit('POEdited', message);
  });

   // createOrder
   socket.on('createOrder', (data) => {
    const { buyerId,inquiryId, poId, message } = data;
    io.to(buyerId).emit('orderCreated', message);
  });

// bookLogistics
  socket.on('bookLogistics', (data) => {
    const { supplierId, message, orderId } = data;
    io.to(supplierId).emit('logisticsRequest', message);
  });

   // shipmentDetailsSubmitted
   socket.on('shipmentDetailsSubmitted', (data) => {
    const { buyerId, orderId, message } = data;
    io.to(buyerId).emit('shipmentDetailsSubmission', message);
  });

  // createOrder
  socket.on('createInvoice', (data) => {
    const { buyerId,orderId, message } = data;
    io.to(buyerId).emit('invoiceCreated', message);
  });

  socket.on('invoicePaymentDone', (data) => {
    const { supplierId,orderId, message } = data;
    io.to(supplierId).emit('invoicePaymentStatusUpdated', message);
  });



  socket.on('buyerRegistration', (data) => {
    const { adminId, message } = data;
    io.to(adminId).emit('buyerRegistered', message);
  });

  socket.on('supplierRegistration', (data) => {
    const { adminId, message } = data;
    io.to(adminId).emit('supplierRegistered', message);
  });

  socket.on('addMedicine', (data) => {
    const { adminId, message } = data;
    io.to(adminId).emit('medicineRequest', message);
  });

  socket.on('editNewMedicine', (data) => {
    const { adminId, message } = data;
    io.to(adminId).emit('newMedicineEditRequest', message);
  });

  socket.on('editSecondaryMedicine', (data) => {
    const { adminId, message } = data;
    io.to(adminId).emit('secondaryMedicineEditRequest', message);
  });


  socket.on('updateMedicineAddRequest', (data) => {
    const { supplierId, message } = data;
    console.log('Current room:', socket.rooms);
    console.log(`addMedicineRequestUpdated ${supplierId}: ${message}`);
    io.to(supplierId).emit('addMedicineRequestUpdated', message);
  });

  socket.on('updateMedicineEditRequest', (data) => {
    const { supplierId, message } = data;
    console.log('Current room:', socket.rooms);
    console.log(`addMedicineRequestUpdated ${supplierId}: ${message}`);
    io.to(supplierId).emit('editMedicineRequestUpdated', message);
  });





  // Handle disconnection
  socket.on('disconnect', () => {
      console.log('User disconnected: ', socket.id);
  });
});






module.exports = app;

