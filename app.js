require('dotenv').config();
const express        = require('express');
let app              = express();
const path           = require('path');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const bodyParser     = require('body-parser');
const connect        = require('./utils/dbConnection')
const initializeSocket = require('./utils/socketHandler');
const { Server }     = require('socket.io'); 
const sendEmail          = require('./utils/emailService')
const {contactUsContent} = require("./utils/emailContents");
const EmailListing = require('./schema/emailListingSchema')

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
const authRoutes = require(`./routes/authRoutes`)

//-----------------   routes   -----------------------//

//db-connection
connect()


app.use('/uploads', express.static('uploads'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.use(express.static(path.join(__dirname, 'public')));


// ------------------- React Frontend ------------------- //
// Serve React build for other routes
app.use(express.static(path.join(__dirname, 'build')));



const corsOptions = {
  origin: [
    'http://192.168.1.31:2221',
    'http://192.168.1.82:3000',
    'http://192.168.1.42:3000',
    'http://192.168.1.87:3000',
    'http://192.168.1.53:3000',
    'http://localhost:2221',
    'http://localhost:3030',
    'http://localhost:8000',
    'http://192.168.1.34:3333',
    'http://192.168.1.218:3030',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3333',
    'http://192.168.1.2:8000',
    'https://medhub.shunyaekai.com'
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


// contact us Email sending route
app.post('/send-email', async (req, res) => {
  console.log('/send-email', req.body); 
  const { username, email, subject, phone, companyname,  message,checkbox, subscribed } = req.body;
// return false
  try {
    if (checkbox === 'on') {
      const existingSubscriber = await EmailListing.findOne({ email });
      if (!existingSubscriber) {
        const newSubscriber = new EmailListing({ username, email, phone });
        await newSubscriber.save();
        console.log(`User subscribed to mailing list: ${email}`);
      } else {
        console.log(`User already subscribed: ${email}`);
      }
    }
    
    const subject = "Inquiry from MedHub Global";
    // const recipientEmails = [process.env.SMTP_USER_ID, "ajo@shunyaekai.tech"];
    const recipientEmails = ["ajo@shunyaekai.tech"];
    const emailContent = await contactUsContent(req.body)
    // const result = await sendEmail({ username, email, subject, phone, message, checkbox });
     await sendEmail(recipientEmails, subject, emailContent);
     res.status(200).json({
      success: true,
      message: "Thank you! We have received your details and will get back to you shortly.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})

//------------------------------ api routes ------------------//
app.use(`/api/auth`,authRoutes)
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
// app.use('/api/order1', orderRouter);
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

app.get(['/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const ADMIN_ID = process.env.ADMIN_ID
const PORT = process.env.PORT || 2222;

const server = app.listen(PORT, (req, res) => {
  console.log(`server is runnig http://localhost:${PORT}/`);
});


initializeSocket(server)




module.exports = app;

