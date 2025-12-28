import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
 


app.use(cors());
app.use(express.json());


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
 
    createAdminUser();
  })
  .catch((err) => console.log("❌ MongoDB connection error:", err));


app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/users", userRoutes);


app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running", status: "ok" });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});


const createAdminUser = async () => {
  try {
    const User = (await import("./models/User.js")).default;
    const bcrypt = (await import("bcryptjs")).default;

    const adminExists = await User.findOne({ email: "admin@cinemahub.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@cinemahub.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("Default admin user created");
    }
  } catch (error) {
    console.log("Admin user creation error:", error.message);
  }
};




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter error:', error);
  } else {
    console.log('Transporter ready to send emails');
  }
});


app.post('/api/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const mailOptions = {
    from: `"Contact Form" <${process.env.EMAIL_USER}>`, // Sender (your email)
    to: process.env.EMAIL_USER, 
    replyTo: email, 
    subject: `New Contact Message from ${name}`,
    text: message,
    html: `
      <h3>New message from ${name}</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
