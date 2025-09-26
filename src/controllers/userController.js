import usersCollection from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const getAllUsers = async (req, res) => {
    try {
        const users = await usersCollection.get();
        const usersList = users.docs.map((doc) => doc.data());
        usersList.forEach((user) => {
            delete user.password;
        });
        res.send(usersList);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await usersCollection.doc(req.params.id).get();
        res.send(user.data());
    } catch (error) {
        res.status(500).send(error);
    }
};

export const createUser = async (req, res) => {
    try {
        const user = await usersCollection.add(req.body);
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const updateUser = async (req, res) => {
    try {
        const user = await usersCollection.doc(req.params.id).update(req.body);
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await usersCollection.doc(req.params.id).delete();
        res.send(user);
    } catch (error) {
        res.status(500).send(error);
    }
};

//auth controller
const signup = async (req, res) => {
    const { name, email, password } = req.body
    if(!name || !email || !password) {
        res.send("Missing Fields")
    }
    let founded = await usersCollection.where("email", "==", email).get()
    if (founded.empty) {
        let hashedPassword = await bcrypt.hash(password, 8)
        await usersCollection.add({name, email, password: hashedPassword, role: "user"})
        res.send("User Created")
    } else {
        res.send("User Already Exists")
    }
}

const login = async (req, res) => {
    const { email, password } = req.body
    let founded = await usersCollection.where("email", "==", email).get()
    if (founded.empty) {
        res.send("User Not Found")
    } else {
        let user = founded.docs[0].data()
        let isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            //generate token
            const userId = founded.docs[0].id
            const role=founded.docs[0].data().role
            const token = jwt.sign({ role, userId }, "secret")
            res.send({ msg: "Login Success", token })
        } else {
            res.send("Incorrect Password")
        }
    }
}



export default {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    signup,
    login
};