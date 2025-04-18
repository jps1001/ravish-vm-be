import { Router } from "express";
import VehicleController from "./vehicle.controller";
import { checkExists, checkUnique } from "../../middleware/middlewareHandler";
import { Vehicle } from "./vehicle.model";
import FileUploadHandler from "../../config/file-upload";

// Controllers
const vehicleController = new VehicleController();

// Middlewares
const fileUploadHandler = new FileUploadHandler('../public/uploads')
const checkUniqueVehicleRCNumber = checkUnique(Vehicle, "vehicleRCNumber", "body", "Vehicle RC number already exists")
const checkUniqueVINNumber = checkUnique(Vehicle, "VIN", "body", "VIN number already exists")
const checkVehicleExists = checkExists(Vehicle, "_id", "params", "Vehicle not found")

// Routes
const routerVehicle = Router();

routerVehicle.get("/", vehicleController.index);
routerVehicle.post("/", checkUniqueVehicleRCNumber, checkUniqueVINNumber, fileUploadHandler.handleFileUploads(), vehicleController.create);
routerVehicle.get("/:_id", checkVehicleExists, vehicleController.show);
routerVehicle.patch("/:_id", checkVehicleExists, fileUploadHandler.handleFileUploads(), vehicleController.update);
routerVehicle.delete("/:_id", checkVehicleExists, vehicleController.delete);
routerVehicle.get("/:key/:_id", vehicleController.belongsTo);

export default routerVehicle;

