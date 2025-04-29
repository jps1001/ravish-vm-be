import { NextFunction } from "express";
import { MRequest, MResponse } from "../../types/express";
import DowntimeService from "../downtimes/downtime.service";
import { CreateDowntimeInput } from "../downtimes/downtime.interface";

export class VehicleMiddleware {

  async initializeVehicleDefaultDownTime(req: MRequest, res: MResponse, next: NextFunction) {
    const originalSend = res.send;
    res.send = function(body) {
      res.locals.responseBody = body;
      console.log(body);
      res.send = originalSend;
      return res.send(body);
    }

    res.on("finish", async () => {
      if (res.statusCode === 201) {
        try {
          const body = typeof res.locals.responseBody === "string"
            ? JSON.parse(res.locals.responseBody)
            : res.locals.responseBody;

          const vehicleId = body?.data?._id;
          if (vehicleId) {
            const downtimeService = new DowntimeService();
            const data: CreateDowntimeInput = {
              vehicleId,
              startTime: new Date(),
              reason: "Vehicle created"
            }
            await downtimeService.create(data)
          }
        } catch (error) {
          console.error("Error creating default downtime:", error);
        }
      }
    });

    next();
  }

}
