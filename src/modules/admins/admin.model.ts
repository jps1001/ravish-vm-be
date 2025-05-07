import mongoose from 'mongoose';
import { AdminUserInput } from './admin.interface';
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

export interface AdminUserType extends AdminUserInput, mongoose.Document { }

const adminSchema = new mongoose.Schema<AdminUserType>({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true },
  aadharNumber: { type: String, required: true, unique: true },
  aadharFile: { type: String },
  type: { type: String, required: true, default: 'user' },
  initialPasswordReset: { type: Boolean, default: false },
  password: { type: String, required: true },
}, {
  timestamps: true
});

adminSchema.plugin(mongoosePagination)

export const AdminUser = mongoose.model<AdminUserType>('AdminUser', adminSchema);
export const AdminUserPaginate: Pagination<AdminUserType> = mongoose.model<AdminUserType, Pagination<AdminUserType>>('AdminUser', adminSchema);

