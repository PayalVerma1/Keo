import * as authService from "./auth.service.js";
export const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            message: "User created successfully",
            user,
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
export const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({
            message: error.message,
        });
    }
};
