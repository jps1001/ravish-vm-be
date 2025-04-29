import mongoose from 'mongoose';
import { z } from 'zod';

export const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  vehicleRCNumber: z.string().min(1, 'Vehicle RC number is required'),
  VIN: z.string().min(1, 'VIN is required'),
  rcFile: z.string().optional(),
  insuranceFile: z.string().optional(),
  vendorId: z.string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
  warehouseId: z.string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    })
    .transform((val) => new mongoose.Types.ObjectId(val)),
});

export const vehiclePartialSchema = vehicleSchema.partial();

export type VehicleInput = z.infer<typeof vehicleSchema>;
