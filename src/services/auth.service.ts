import User from "../models/User";
import bcrypt from "bcryptjs";

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: "user" | "admin"
) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return user;
};