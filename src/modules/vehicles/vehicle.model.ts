import mongoose from "mongoose";
import { VehicleInput } from "./vehicle.interface";
import { mongoosePagination, Pagination } from "mongoose-paginate-ts";

export interface VehicleType extends VehicleInput, mongoose.Document { }

const vehicleSchema = new mongoose.Schema<VehicleType>({
  make: { type: String, required: true },
  chasisNumber: { type: String, required: true, unique: true },
  vehicleRCNumber: { type: String, required: true, unique: true },
  VIN: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  rcFile: { type: String, required: false },
  insuranceFile: { type: String, required: false },
}, {
  timestamps: true
});

vehicleSchema.plugin(mongoosePagination)

export const Vehicle = mongoose.model<VehicleType>('Vehicle', vehicleSchema);
export const VehiclePaginate: Pagination<VehicleType> = mongoose.model<VehicleType, Pagination<VehicleType>>('Vehicle', vehicleSchema);
