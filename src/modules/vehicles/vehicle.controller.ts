import { SuccessResponseSchema } from "../../interfaces/apiResponse";
import { buildPaginationOptions } from "../../utils/buildPaginationOptions";
import catchAsync from "../../utils/catchAsync";
import { vehiclePartialSchema, vehicleSchema } from "./vehicle.interface";
import { vehicleAggregates, vehicleQueries } from "./vehicle.query";
import VehicleService from "./vehicle.service";
import { MRequest, MResponse } from "../../types/express";
import { buildMatchStage } from "./vehicle.helper";


class VehicleController {
  vehicleService = new VehicleService();

  index = catchAsync(async (req: MRequest, res: MResponse) => {
    const options = buildPaginationOptions(req, {
      allowedQueryFields: vehicleQueries,
      predefinedAggregates: vehicleAggregates,
    });
    const vehicles = await this.vehicleService.index(options);
    const response = SuccessResponseSchema.parse({
      message: "Vehicles fetched successfully",
      data: vehicles,
    });
    res.status(200).json(response);
  })

  show = catchAsync(async (req: MRequest, res: MResponse) => {
    const vehicleId = req.params._id;
    const options = buildPaginationOptions(req, {
      allowedQueryFields: vehicleQueries,
      predefinedAggregates: vehicleAggregates,
      mode: "single",
    });
    const vehicle = await this.vehicleService.show(vehicleId, options);
    const response = SuccessResponseSchema.parse({
      message: "Vehicle fetched successfully",
      data: vehicle,
    });
    res.status(200).json(response);
  })

  create = catchAsync(async (req: MRequest, res: MResponse) => {
    const parsedPayload = vehicleSchema.parse(req.body);
    const vehicle = await this.vehicleService.create(parsedPayload);
    const response = SuccessResponseSchema.parse({
      message: "Vehicle created successfully",
      data: vehicle,
    });
    res.status(201).json(response);
  })

  update = catchAsync(async (req: MRequest, res: MResponse) => {
    const vehicleId = req.params._id;
    const parsedPayload = vehiclePartialSchema.parse(req.body);
    console.log(req.body);
    console.log(parsedPayload);
    const vehicle = await this.vehicleService.update(vehicleId, parsedPayload);
    const response = SuccessResponseSchema.parse({
      message: "Vehicle updated successfully",
      data: vehicle,
    });
    res.status(200).json(response);
  })

  delete = catchAsync(async (req: MRequest, res: MResponse) => {
    const vehicleId = req.params._id;
    const vehicle = await this.vehicleService.delete(vehicleId);
    const response = SuccessResponseSchema.parse({
      message: "Vehicle deleted successfully",
      data: vehicle,
    });
    res.status(200).json(response);
  })


  belongsTo = catchAsync(async (req: MRequest, res: MResponse) => {
    const { key, _id } = req.params;
    const matchStage = buildMatchStage(key, _id);

    const options = buildPaginationOptions(req, {
      allowedQueryFields: vehicleQueries,
      predefinedAggregates: vehicleAggregates,
    });

    options.aggregate = [matchStage, ...options.aggregate];

    const vehicles = await this.vehicleService.index(options);
    const response = SuccessResponseSchema.parse({
      message: "Vehicles fetched successfully",
      data: vehicles,
    });
    res.status(200).json(response);
  })
}

export default VehicleController;
