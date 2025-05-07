import mongoose from 'mongoose';
import { DriverInput, EmergencyContactInput } from './driver.interface';
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

export interface DriverType extends DriverInput, mongoose.Document { }
export interface EmergencyContactType extends EmergencyContactInput, mongoose.Document { }


export const emergencyContactSchema = new mongoose.Schema<EmergencyContactType>({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  aadharNumber: { type: String, required: false },
  aadharFile: { type: String, required: false },
});

const driverSchema = new mongoose.Schema<DriverType>({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  aadharNumber: { type: String, required: true, unique: true },
  aadharFile: { type: String },
  panNumber: { type: String, required: true, unique: true },
  panFile: { type: String },
  dlNumber: { type: String },
  dlFile: { type: String },
  riderPhoto: { type: String, required: true },

  vehicleRentDeduction: { type: Number, default: 6000 },
  accommodationDeduction: { type: Number, default: 2000 },
  emergencyContacts: {
    type: [emergencyContactSchema],
    validate: {
      validator: (contacts: EmergencyContactType[]) => {
        return contacts.length >= 2;
      },
      message: 'At least 2 POCs are required',
    }
  }
}, {
  timestamps: true
});

driverSchema.plugin(mongoosePagination)

export const Driver = mongoose.model<DriverType>('Driver', driverSchema);
export const DriverPaginate: Pagination<DriverType> = mongoose.model<DriverType, Pagination<DriverType>>('Driver', driverSchema);

