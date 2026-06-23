import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  if (!data?.name || !data?.email || !data?.password) {
    throw new Error("name, email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) throw new Error("User already exists");

  const hashed = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
    },
  });

  return user;
};

export const login = async (data: { email: string; password: string }) => {
  if (!data?.email || !data?.password) {
    throw new Error("email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) throw new Error("User not found");

  const isPassword = await bcrypt.compare(data.password, user.password);

  if (!isPassword) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { token, user };
};
