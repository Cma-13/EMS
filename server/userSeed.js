import 'dotenv/config'
import User from "./models/User.js"
import bcrypt from "bcrypt"
import connectToDatabase from "./db/db.js"

// Creates the first admin. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env
// (falls back to the old defaults if they're missing). Run once.
const userRegister = async () => {
    await connectToDatabase();
    try {
        const email    = process.env.ADMIN_EMAIL    || "admin@gmail.com";
        const password = process.env.ADMIN_PASSWORD || "admin";

        if (await User.findOne({ email })) {
            console.log(`Admin ${email} already exists - nothing to do.`);
            return;
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: "Admin",
            email,
            password: hashPassword,
            role: "admin"
        });
        await user.save();
        console.log(`Admin user created: ${email}`);
        if (!process.env.ADMIN_PASSWORD)
            console.log("Using the default password - change it after logging in.");
    } catch (error) {
        console.log(error);
    } finally {
        process.exit(0);
    }
}

userRegister();
