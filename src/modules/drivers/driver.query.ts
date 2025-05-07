export const driverQueries = ["state", "city"]

export const driverAggregates = {
  withActiveRide: [
    {
      $lookup: {
        from: "ridehistories",
        localField: "_id",
        foreignField: "driverId",
        as: "rideHistories"
      }
    },
    {
      $addFields: {
        activeRides: {
          $filter: {
            input: "$rideHistories",
            as: "ride",
            cond: { $not: ["$$ride.endTime"] }
          }
        }
      }
    },
    {
      $match: {
        "activeRides.0": { $exists: true } // Means there is at least one active ride
      }
    }

  ],
  withoutActiveRide: [
    {
      $lookup: {
        from: "ridehistories",
        localField: "_id",
        foreignField: "driverId",
        as: "rideHistories"
      }
    },
    {
      $addFields: {
        activeRides: {
          $filter: {
            input: "$rideHistories",
            as: "ride",
            cond: { $not: ["$$ride.endTime"] }
          }
        }
      }
    },
    {
      $match: {
        "activeRides": { $eq: [] } // No active rides
      }
    }
  ],

  withAllRides: [
    {
      $lookup: {
        from: "ridehistories",
        localField: "_id",
        foreignField: "driverId",
        as: "rideHistories"
      }
    }
  ],
  countOverTime: [
    {
      $match: {
        updatedAt: {
          $gte: "{{start}}",
          $lte: "{{end}}",
        },
      },
    },
    {
      $lookup: {
        from: "ridehistories",
        localField: "_id",
        foreignField: "driverId",
        as: "rideHistories",
      },
    },
    {
      $addFields: {
        hasActiveRide: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$rideHistories",
                  as: "ride",
                  cond: { $not: ["$$ride.endTime"] },
                },
              },
            },
            0,
          ],
        },
        day: {
          $dateTrunc: {
            date: "$updatedAt",
            unit: "day",
          },
        },
      },
    },
    {
      $set: {
        isActive: {
          $cond: [{ $eq: ["$hasActiveRide", true] }, 1, 0],
        },
        isInactive: {
          $cond: [{ $eq: ["$hasActiveRide", false] }, 1, 0],
        },
      },
    },
    {
      $group: {
        _id: "$day",
        count: { $sum: 1 },
        activeDrivers: { $sum: "$isActive" },
        inactiveDrivers: { $sum: "$isInactive" },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $setWindowFields: {
        sortBy: { _id: 1 },
        output: {
          count: {
            $sum: "$count",
            window: { documents: ["unbounded", "current"] },
          },
          activeDrivers: {
            $sum: "$activeDrivers",
            window: { documents: ["unbounded", "current"] },
          },
          inactiveDrivers: {
            $sum: "$inactiveDrivers",
            window: { documents: ["unbounded", "current"] },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        activeDrivers: 1,
        inactiveDrivers: 1,
      },
    },
  ],

};

